import { NextResponse } from "next/server";
import { sendWhatsapp, sendMedia } from "@/lib/evolution";
import prisma from "@/lib/prisma";
import { getPicPayToken } from "@/lib/picpay";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("📸 [PicPay Webhook] Recebido:", body);

        // PicPay envia paymentId no corpo
        const { paymentId, referenceId, status } = body;

        if (!paymentId) {
            return NextResponse.json({ error: "No payment ID found" }, { status: 400 });
        }

        // 1. Consultar status real na API do PicPay para segurança
        const accessToken = await getPicPayToken();
        const response = await fetch(`https://checkout-api.picpay.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const picpayPayment = await response.json();

        // Status do PicPay: 'paid', 'pending', 'refunded', 'expired', 'canceled'
        const currentStatus = picpayPayment.status;
        console.log(`📸 [PicPay Webhook] Status Real: ${currentStatus} | Ref: ${referenceId}`);

        if (currentStatus === "paid") {
            // O referenceId é clientID_timestamp
            const clientId = referenceId.split("_")[0];

            // 2. Buscar dados do cliente no banco
            const client = await (prisma as any).client.findUnique({
                where: { id: clientId },
            });

            if (!client) {
                console.error("❌ [PicPay Webhook] Cliente não encontrado:", clientId);
                return NextResponse.json({ error: "Client not found" }, { status: 404 });
            }

            // 3. Verificar se já processamos esse pagamento
            const existingPayment = await (prisma as any).payment.findUnique({
                where: { mpPaymentId: String(paymentId) } // Reutilizando campo para simplificar ou mudar nome se necessário
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
                    amount: picpayPayment.value || 0,
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

            // 6. Enviar Mensagem para o Cliente
            const message = `🎉 *Parabéns, ${client.name}!* Seu pagamento via PicPay foi aprovado!\n\n` +
                `📦 *Plano Adquirido:* ${planName}\n\n` +
                `⏳ Nosso administrador já foi notificado da sua compra e enviará a sua *Chave de Licença* de acesso por aqui mesmo em instantes.\n\n` +
                `📹 *Vídeo Tutorial de Instalação:* ${videoUrl}\n` +
                `👥 *Acesse nosso Grupo Exclusivo VIP:* ${customerGroupUrl}\n\n` +
                `Já estou enviando abaixo o arquivo da extensão para você baixar. 👇`;

            await sendWhatsapp(client.whatsapp, message);
            await sendMedia(client.whatsapp, extensionUrl, "Arquivo de instalação 🚀", "mega_2ai_latest.zip");

            // 7. Notificar Administrador
            const adminMessage = `🚨 *VENDA APROVADA (PICPAY) - GERAR LICENÇA!*\n\n` +
                `👤 *Cliente:* ${client.name}\n` +
                `📧 *Email:* ${client.email}\n` +
                `📱 *WhatsApp:* https://wa.me/${client.whatsapp.replace(/\D/g, "")}\n` +
                `💵 *Valor:* R$ ${picpayPayment.value}\n\n` +
                `⚠️ Gere a licença e envie agora!`;

            await sendWhatsapp(process.env.ADMIN_WHATSAPP || "", adminMessage);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("❌ [PicPay Webhook] Erro:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
