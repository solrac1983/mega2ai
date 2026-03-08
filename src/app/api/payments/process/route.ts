import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { planId, planName, price, clientInfo } = body;
        const { name, email, whatsapp, document } = clientInfo;

        console.log("💳 [MP Process] Iniciando para:", { planName, email });

        // 0. Autenticação Segura Mercado Pago (inicializado dentro da rota para garantir o ENV)
        const token = process.env.MP_ACCESS_TOKEN;
        if (!token) {
            console.error("❌ MP_ACCESS_TOKEN não está definido no .env");
            return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 });
        }

        const mpClient = new MercadoPagoConfig({
            accessToken: token,
            options: { timeout: 5000 }
        });
        const payment = new Payment(mpClient);

        // 1. Criar/Atualizar cliente no banco de forma robusta
        let client = await (prisma as any).client.findUnique({
            where: { whatsapp },
        });

        if (client) {
            client = await (prisma as any).client.update({
                where: { id: client.id },
                data: { email, name },
            });
        } else {
            client = await (prisma as any).client.findUnique({
                where: { email },
            });

            if (client) {
                client = await (prisma as any).client.update({
                    where: { id: client.id },
                    data: { whatsapp, name },
                });
            } else {
                client = await (prisma as any).client.create({
                    data: { name, email, whatsapp, plan: planName || "Extensão Mega_2ai" },
                });
            }
        }

        // 2. Criar Pix via Mercado Pago Backend API
        const priceNumber = Number(price.replace(",", "."));

        const paymentData = {
            body: {
                transaction_amount: priceNumber,
                description: `Compra - ${planName || "Mega_2ai"}`,
                payment_method_id: "pix",
                payer: {
                    email: client.email,
                    first_name: name.split(" ")[0],
                    last_name: name.split(" ").slice(1).join(" ") || "Cliente",
                    identification: {
                        type: "CPF",
                        number: document ? document.replace(/\D/g, "") : "00000000000"
                    }
                },
                external_reference: client.id,
                notification_url: `${process.env.WEBHOOK_URL}/api/webhooks/mercadopago`
            }
        };

        const mpResponse = await payment.create(paymentData);

        if (!mpResponse || !(mpResponse as any).point_of_interaction?.transaction_data) {
            console.error("❌ MP QR Code Error:", mpResponse);
            throw new Error("Falha ao extrair QR Code do Mercado Pago");
        }

        const qrCodeData = (mpResponse as any).point_of_interaction.transaction_data;

        return NextResponse.json({
            qr_code: qrCodeData.qr_code,
            qr_code_base64: qrCodeData.qr_code_base64,
            payment_url: (mpResponse as any).point_of_interaction?.transaction_data?.ticket_url || ""
        });

    } catch (error: any) {
        console.error("❌ Erro MP API:", error);
        return NextResponse.json({
            error: "Erro ao gerar PIX: " + (error.message || String(error)),
            details: error.message || String(error)
        }, { status: 500 });
    }
}
