import { NextResponse } from "next/server";
import { mpClient } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const payment = new Payment(mpClient);

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Dados vindos do Mercado Pago Brick
        const { formData, planId, planName, clientInfo } = body;
        const { name, email, whatsapp } = clientInfo;

        // 1. Criar/Atualizar cliente
        const client = await prisma.client.upsert({
            where: { email },
            update: { name, whatsapp },
            create: { name, email, whatsapp },
        });

        const paymentResponse = await payment.create({
            body: {
                transaction_amount: formData.transaction_amount,
                token: formData.token,
                description: `mega_2ai - Plano ${planName}`,
                installments: formData.installments,
                payment_method_id: formData.payment_method_id,
                issuer_id: formData.issuer_id,
                payer: {
                    email: email,
                    identification: formData.payer.identification,
                },
                notification_url: `${process.env.WEBHOOK_URL}/api/webhooks/mercadopago`,
                external_reference: client.id,
                additional_info: {
                    items: [
                        {
                            id: planId,
                            title: `mega_2ai - Plano ${planName}`,
                            quantity: 1,
                            unit_price: formData.transaction_amount,
                        }
                    ]
                }
            },
        });

        return NextResponse.json({
            status: paymentResponse.status,
            status_detail: paymentResponse.status_detail,
            id: paymentResponse.id,
        });

    } catch (error: any) {
        console.error("Payment Process Error:", error);
        return NextResponse.json({
            error: "Erro ao processar pagamento",
            details: error.message
        }, { status: 500 });
    }
}
