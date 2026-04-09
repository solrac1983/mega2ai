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

                // 3. Buscar Plano e Configurações (Via Metadata ou DB se já existir vínculo)
                const planId = mpPayment.metadata?.plan_id;
                const plan = planId ? await (prisma as any).plan.findUnique({ where: { id: planId } }) : null;
                const settings = await (prisma as any).settings.findUnique({ where: { id: "global" } });

                // 4. Salvar/Atualizar pagamento no DB com vínculo ao Plano
                await (prisma as any).payment.upsert({
                    where: { mpPaymentId: String(paymentId) },
                    update: { 
                        status: "APPROVED",
                        planId: plan?.id || null 
                    },
                    create: {
                        mpPaymentId: String(paymentId),
                        amount: mpPayment.transaction_amount || 0,
                        status: "APPROVED",
                        clientId: client.id,
                        planId: plan?.id || null
                    }
                });

                // 5. Lógica de Entrega Baseada no Tipo de Plano
                let licenseKey = "";
                let creditsAdded = 0;
                const planName = plan?.name || "Extensão Mega_2ai";

                if (plan) {
                    if (plan.type === 'CREDITS') {
                        // ENTREGA DE CRÉDITOS
                        creditsAdded = plan.credits || 0;
                        await (prisma as any).client.update({
                            where: { id: client.id },
                            data: { credits: { increment: creditsAdded } }
                        });
                        console.log(`💎 [Webhook] ${creditsAdded} créditos entregues para ${client.email}`);
                    } else {
                        // ENTREGA DE LICENÇA (Temporal/Vitalícia)
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
                        console.log(`🔑 [Webhook] Licença ${licenseKey} gerada para ${client.email}`);
                    }
                }

                // 6. Enviar Mensagem de Entrega para o Cliente
                try {
                    const { sendWelcomeKit } = await import("@/lib/notifications");
                    await sendWelcomeKit(
                        client.id,
                        licenseKey,
                        planName,
                        client.whatsapp,
                        client.name,
                        creditsAdded // Passa a quantidade de créditos (0 se for licença)
                    );
                } catch (kitError) {
                    console.error("Erro ao enviar kit via webhook:", kitError);
                }

                // 7. Notificar Administrador
                const adminMessage = `💰 *VENDA APROVADA - R$ ${mpPayment.transaction_amount}*\n` +
                    `👤 *Cliente:* ${client.name}\n` +
                    `📦 *Produto:* ${planName}\n` +
                    `${creditsAdded > 0 ? `💎 *Créditos:* ${creditsAdded}` : `🔑 *Chave:* ${licenseKey}`}`;

                await sendWhatsapp(process.env.ADMIN_WHATSAPP || "", adminMessage);

                // 8. Incrementar uso do Cupom (se houver)
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
