import { NextResponse } from "next/server";
import { sendWhatsapp, sendMedia } from "@/lib/evolution";
import { PrismaClient } from "@prisma/client";
import { payment } from "@/lib/mercadopago";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Mercado Pago Webhook:", body);

        // Tipos de notificação do MP: "payment" ou "plan_subscription"
        if (body.type === "payment" || body.action === "payment.created" || body.action === "payment.updated") {
            const paymentId = body.data?.id || body.id;

            if (!paymentId) {
                return NextResponse.json({ error: "No payment ID found" }, { status: 400 });
            }

            // 1. Consultar status real na API do Mercado Pago
            const mpPayment = await payment.get({ id: paymentId });
            const status = mpPayment.status;
            const clientId = mpPayment.external_reference; // ID do cliente salvo no checkout

            console.log(`Pagamento ${paymentId} status: ${status} | Cliente: ${clientId}`);

            if (status === "approved" && clientId) {
                // 2. Buscar dados do cliente no banco
                const client = await prisma.client.findUnique({
                    where: { id: clientId },
                });

                if (!client) {
                    console.error("Cliente não encontrado para o pagamento:", paymentId);
                    return NextResponse.json({ error: "Client not found" }, { status: 404 });
                }

                // 3. Verificar se já processamos esse pagamento para evitar duplicidade
                const existingPayment = await prisma.payment.findUnique({
                    where: { mpPaymentId: String(paymentId) }
                });

                if (existingPayment && existingPayment.status === "APPROVED") {
                    return NextResponse.json({ received: true, message: "Already processed" });
                }

                const mpPlanId = mpPayment.additional_info?.items?.[0]?.id || "unknown";

                // 4. Buscar o plano no banco para saber a duração
                const plan = await prisma.plan.findUnique({
                    where: { id: mpPlanId }
                });

                // 5. Salvar pagamento no DB
                await prisma.payment.upsert({
                    where: { mpPaymentId: String(paymentId) },
                    update: { status: "APPROVED" },
                    create: {
                        mpPaymentId: String(paymentId),
                        amount: mpPayment.transaction_amount || 0,
                        status: "APPROVED",
                        clientId: client.id
                    }
                });

                // 7. Salvar Dados (sem a licença)
                const planName = plan?.name || mpPayment.additional_info?.items?.[0]?.title || "Extensão Mega";

                // 8. Buscar configurações globais para links dinâmicos
                const settings = await prisma.settings.findUnique({ where: { id: "global" } });
                const customerGroupUrl = settings?.customerGroupUrl || "https://chat.whatsapp.com/exemplo";
                const extensionUrl = settings?.extensionUrl || "https://mega2ai.com/download/mega_2ai_v2.zip";

                // 9. Enviar Mensagem de 'Parabéns' para o Cliente via WhatsApp
                const message = `🎉 *Parabéns, ${client.name}!* Seu pagamento foi aprovado!\n\n` +
                    `📦 *Plano Adquirido:* ${planName}\n\n` +
                    `⏳ Nosso administrador já foi notificado da sua compra e enviará a sua *Chave de Licença* de acesso por aqui mesmo em instantes.\n\n` +
                    `📺 *Tutoriais de Instalação:* https://mega2ai.com/ajuda\n` +
                    `👥 *Acesse nosso Grupo Exclusivo VIP:* ${customerGroupUrl}\n\n` +
                    `Enquanto aguarda sua licença, já estou enviando abaixo o arquivo da extensão para você baixar. 👇`;

                await sendWhatsapp(client.whatsapp, message);

                // Enviar o arquivo da extensão dinâmico
                await sendMedia(client.whatsapp, extensionUrl, "Aqui está o seu arquivo de instalação conforme prometido! 🚀", "mega_2ai_v2.zip");

                // 10. Notificar Administrador para Gerar Licença
                const adminMessage = `🚨 *VENDA APROVADA - GERAR LICENÇA!*\n\n` +
                    `👤 *Cliente:* ${client.name}\n` +
                    `📧 *Email:* ${client.email}\n` +
                    `📱 *WhatsApp:* https://wa.me/${client.whatsapp.replace(/\\D/g, "")}\n` +
                    `📦 *Plano:* ${planName}\n` +
                    `💵 *Valor:* R$ ${mpPayment.transaction_amount}\n\n` +
                    `⚠️ *Ação Necessária:* Gere a licença no painel da Leigos Academy e envie para o cliente pelo link do WhatsApp acima.`;

                await sendWhatsapp(process.env.ADMIN_WHATSAPP || "", adminMessage);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: unknown) {
        const err = error as Error;
        console.error("Webhook Error:", err.message || err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
