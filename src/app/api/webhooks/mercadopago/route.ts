import { NextResponse } from "next/server";
import { sendWhatsapp, sendMedia } from "@/lib/evolution";
import prisma from "@/lib/prisma";
import { payment } from "@/lib/mercadopago";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Mercado Pago Webhook Received:", body);

        // Tipos de notificação do MP: "payment" ou "plan_subscription"
        if (body.type === "payment" || body.action?.includes("payment")) {
            const paymentId = body.data?.id || body.id;

            if (!paymentId) {
                return NextResponse.json({ error: "No payment ID found" }, { status: 400 });
            }

            // 1. Consultar status real na API do Mercado Pago
            const mpPayment = await payment.get({ id: String(paymentId) });
            const status = mpPayment.status;
            const clientId = mpPayment.external_reference;

            console.log(`Pagamento ${paymentId} status: ${status} | Cliente: ${clientId}`);

            if (status === "approved" && clientId) {
                // 2. Buscar dados do cliente no banco
                const client = await (prisma as any).client.findUnique({
                    where: { id: clientId },
                });

                if (!client) {
                    console.error("Cliente não encontrado para o pagamento:", paymentId);
                    return NextResponse.json({ error: "Client not found" }, { status: 404 });
                }

                // 3. Verificar se já processamos esse pagamento
                const existingPayment = await (prisma as any).payment.findUnique({
                    where: { mpPaymentId: String(paymentId) }
                });

                if (existingPayment && existingPayment.status === "APPROVED") {
                    return NextResponse.json({ received: true, message: "Already processed" });
                }

                // 4. Salvar pagamento no DB
                await (prisma as any).payment.upsert({
                    where: { mpPaymentId: String(paymentId) },
                    update: { status: "APPROVED" },
                    create: {
                        mpPaymentId: String(paymentId),
                        amount: mpPayment.transaction_amount || 0,
                        status: "APPROVED",
                        clientId: client.id
                    }
                });

                // 5. Buscar configurações globais e Plano
                const settings = await (prisma as any).settings.findUnique({ where: { id: "global" } });
                const planId = mpPayment.metadata?.plan_id;
                const plan = planId ? await (prisma as any).plan.findUnique({ where: { id: planId } }) : null;

                const customerGroupUrl = settings?.customerGroupUrl || "https://chat.whatsapp.com/LF7CWKZf5Dx2VGdsTw0aft";
                const extensionUrl = settings?.extensionUrl || "https://mega2ai.com/download/mega_2ai_latest.zip";
                const videoUrl = settings?.videoUrl || "https://mega2ai.com/ajuda";
                const planName = plan?.name || "Extensão Mega_2ai";

                // 6. Gerar Licença Automática
                let licenseKey = "ERRO-CONTATE-SUPORTE";
                if (plan) {
                    let expiresAt = null;
                    if (plan.durationDays) {
                        expiresAt = new Date();
                        if (plan.id === "free") {
                            expiresAt.setMinutes(expiresAt.getMinutes() + plan.durationDays);
                        } else {
                            expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
                        }
                    }

                    licenseKey = `KEY-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

                    await (prisma as any).license.create({
                        data: {
                            clientId: client.id,
                            planId: plan.id,
                            key: licenseKey,
                            status: "ACTIVE",
                            expiresAt
                        }
                    });
                }

                // 7. Enviar Mensagem de Entrega para o Cliente (Kit Completo)
                try {
                    const { sendWelcomeKit } = await import("@/lib/notifications");
                    await sendWelcomeKit(
                        client.id,
                        licenseKey,
                        planName,
                        client.whatsapp,
                        client.name
                    );
                } catch (kitError) {
                    console.error("Erro ao enviar kit via webhook:", kitError);
                }

                // 8. Notificar Administrador
                const adminMessage = `💰 *VENDA AUTOMATIZADA - R$ ${mpPayment.transaction_amount}*\n` +
                    `👤 *Cliente:* ${client.name}\n` +
                    `🔑 *Chave:* ${licenseKey}`;

                await sendWhatsapp(process.env.ADMIN_WHATSAPP || "", adminMessage);

                // 9. Incrementar uso do Cupom (se houver)
                const couponId = mpPayment.metadata?.coupon_id;
                if (couponId) {
                    try {
                        await (prisma as any).coupon.update({
                            where: { id: couponId },
                            data: { usedCount: { increment: 1 } }
                        });
                    } catch (err) {
                        console.error("Erro ao incrementar uso do cupom:", err);
                    }
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
