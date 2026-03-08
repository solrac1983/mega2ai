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

                // 6. Gerar a Licença Automaticamente via API do Leigos Academy
                let licenseKey = "Pendente";
                try {
                    console.log(`⏳ Gerando licença para ${client.email}...`);
                    licenseKey = await generateLicenseKey(client.email, planName);

                    // Salvar a licença no banco de dados vinculada ao cliente
                    await (prisma as any).license.create({
                        data: {
                            key: licenseKey,
                            status: "active",
                            clientId: client.id
                        }
                    });
                    console.log(`✅ Licença ${licenseKey} gerada e salva com sucesso!`);
                } catch (licError) {
                    console.error("❌ Falha na automação da licença:", licError);
                    licenseKey = "Falha ao gerar (O Suporte enviará em breve)";
                }

                // 7. Enviar Mensagem de 'Parabéns' com a Licença para o Cliente
                const message = `🎉 *Parabéns, ${client.name}!* Seu pagamento foi aprovado!\n\n` +
                    `📦 *Plano Adquirido:* ${planName}\n\n` +
                    `🔑 *Sua Chave de Licença:* \n*${licenseKey}*\n\n` +
                    `_Copie a chave acima e cole na extensão para ativá-la._\n\n` +
                    `📹 *Vídeo Tutorial de Instalação:* ${videoUrl}\n` +
                    `👥 *Acesse nosso Grupo Exclusivo VIP:* ${customerGroupUrl}\n\n` +
                    `Já estou enviando abaixo o arquivo da extensão para você baixar. 👇`;

                await sendWhatsapp(client.whatsapp, message);
                await sendMedia(client.whatsapp, extensionUrl, "Arquivo de instalação 🚀", "mega_2ai_latest.zip");

                // 8. Notificar Administrador
                const adminMessage = `🚨 *VENDA APROVADA - AUTOMATIZADA!*\n\n` +
                    `👤 *Cliente:* ${client.name}\n` +
                    `📧 *Email:* ${client.email}\n` +
                    `📱 *WhatsApp:* https://wa.me/${client.whatsapp.replace(/\D/g, "")}\n` +
                    `💵 *Valor:* R$ ${mpPayment.transaction_amount}\n\n` +
                    `🔑 *Licença Gerada:* ${licenseKey}\n\n` +
                    `🤖 _Tudo foi concluído, o cliente já recebeu a extensão e a licença automaticamente._`;

                await sendWhatsapp(process.env.ADMIN_WHATSAPP || "", adminMessage);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
