import { NextResponse } from "next/server";
import { sendWhatsapp, sendMedia } from "@/lib/evolution";
import prisma from "@/lib/prisma";
import { payment } from "@/lib/mercadopago";
import { generateLicenseKey } from "@/lib/license";

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

                // 5. Buscar configurações globais
                const settings = await (prisma as any).settings.findUnique({ where: { id: "global" } });
                const customerGroupUrl = settings?.customerGroupUrl || "https://chat.whatsapp.com/LF7CWKZf5Dx2VGdsTw0aft";
                const extensionUrl = settings?.extensionUrl || "https://mega2ai.com/download/mega_2ai_latest.zip";
                const videoUrl = settings?.videoUrl || "https://mega2ai.com/ajuda";
                const planName = "Extensão Mega_2ai";

                // 6. Enviar Mensagem de 'Parabéns' para o Cliente
                const message = `🎉 *Parabéns, ${client.name}!* Seu pagamento foi aprovado!\n\n` +
                    `📦 *Plano Adquirido:* ${planName}\n\n` +
                    `⏳ Nosso administrador já foi notificado da sua compra e enviará a sua *Chave de Licença* de acesso por aqui mesmo em instantes.\n\n` +
                    `📹 *Vídeo Tutorial de Instalação:* ${videoUrl}\n` +
                    `👥 *Acesse nosso Grupo Exclusivo VIP:* ${customerGroupUrl}\n\n` +
                    `Enquanto aguarda sua licença, já estou enviando abaixo o arquivo da extensão para você baixar. 👇`;

                await sendWhatsapp(client.whatsapp, message);
                await sendMedia(client.whatsapp, extensionUrl, "Arquivo de instalação 🚀", "mega_2ai_latest.zip");

                // 7. Notificar Administrador
                const adminMessage = `🚨 *VENDA APROVADA - GERAR LICENÇA!*\n\n` +
                    `👤 *Cliente:* ${client.name}\n` +
                    `📧 *Email:* ${client.email}\n` +
                    `📱 *WhatsApp:* https://wa.me/${client.whatsapp.replace(/\D/g, "")}\n` +
                    `💵 *Valor:* R$ ${mpPayment.transaction_amount}\n\n` +
                    `⚠️ Gere a licença manualmente e envie para o cliente agora!`;

                await sendWhatsapp(process.env.ADMIN_WHATSAPP || "", adminMessage);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
