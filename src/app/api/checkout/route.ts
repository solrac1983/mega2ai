import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { name, email, whatsapp, planId, planName, price } = await req.json();

        // 1. Salvar ou atualizar cliente no banco
        const client = await prisma.client.upsert({
            where: { email },
            update: { name, whatsapp },
            create: { name, email, whatsapp },
        });

        // 2. Se o plano for GRÁTIS (0,00), processamos a licença imediatamente
        if (Number(price.replace(",", ".")) === 0) {
            // Buscar configurações globais
            const settings = await prisma.settings.findUnique({ where: { id: "global" } });
            const extensionUrl = settings?.extensionUrl || "https://mega2ai.com/download/mega_2ai_v2.zip";

            const { sendWhatsapp, sendMedia } = await import("@/lib/evolution");

            // 1. Mensagem para o Cliente
            const customerGroupUrl = settings?.customerGroupUrl || "https://chat.whatsapp.com/exemplo";
            const message = `🎉 *Parabéns, ${name}!* Seu teste grátis do *mega_2ai* foi ativado!\n\n` +
                `📦 *Plano:* ${planName}\n\n` +
                `⏳ Em instantes, o nosso administrador enviará a sua *Chave de Licença* de acesso por aqui mesmo.\n\n` +
                `👥 *Acesse nosso Grupo Exclusivo de Clientes VIPs:* ${customerGroupUrl}\n\n` +
                `Enquanto isso, já estou enviando abaixo o arquivo da extensão para você baixar e instalar. 👇`;

            await sendWhatsapp(whatsapp, message);
            await sendMedia(whatsapp, extensionUrl, "Arquivo de instalação", "mega_2ai_v2.zip");

            // 2. Notificar Admin para gerar licença
            const adminMessage = `🚨 *NOVO TESTE GRÁTIS - GERAR LICENÇA!*\n\n` +
                `👤 *Cliente:* ${name}\n` +
                `📧 *Email:* ${email}\n` +
                `📱 *WhatsApp:* https://wa.me/${whatsapp.replace(/\\D/g, "")}\n` +
                `📦 *Plano:* ${planName}\n\n` +
                `⚠️ *Ação Necessária:* Gere a licença no painel da Leigos Academy e envie para o cliente pelo link do WhatsApp acima.`;
            await sendWhatsapp(process.env.ADMIN_WHATSAPP || "", adminMessage);

            // Retornar um init_point especial ou flag para o frontend
            return NextResponse.json({ success: true, free: true });
        }

        // 3. Criar a preferência no Mercado Pago (para planos pagos)
        const preference = new Preference(mpClient);

        const response = await preference.create({
            body: {
                items: [
                    {
                        id: planId,
                        title: `mega_2ai - Plano ${planName}`,
                        quantity: 1,
                        unit_price: Number(price.replace(",", ".")),
                        currency_id: "BRL",
                    },
                ],
                payer: {
                    name: name,
                    email: email,
                },
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/obrigado`,
                    failure: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/pagamento-falhou`,
                    pending: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/pendente`,
                },
                auto_return: "approved",
                external_reference: client.id, // ID do cliente para recuperar no webhook
                notification_url: `${process.env.WEBHOOK_URL}/api/webhooks/mercadopago`,
            },
        });

        return NextResponse.json({ id: response.id, init_point: response.init_point });
    } catch (error: any) {
        console.error("Checkout Error DETAILS:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return NextResponse.json({ error: "Erro ao iniciar checkout: " + error.message }, { status: 500 });
    }
}
