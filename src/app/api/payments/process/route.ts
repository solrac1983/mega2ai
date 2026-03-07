import { NextResponse } from "next/server";
import { mpClient } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const payment = new Payment(mpClient);

        // Dados vindos do Mercado Pago Brick
        const { formData, planId, planName, clientInfo } = body;
        const { name, email, whatsapp } = clientInfo;

        // 1. Criar/Atualizar cliente
        const client = await (prisma as any).client.upsert({
            where: { email },
            update: { name, whatsapp },
            create: { name, email, whatsapp },
        });

        // 2. Extrair dados para o Mercado Pago
        const mpPayload: any = {
            transaction_amount: formData.transaction_amount,
            description: `mega_2ai - Plano ${planName}`,
            payment_method_id: formData.payment_method_id,
            payer: {
                email: email,
                identification: formData.payer?.identification,
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
        };

        // Adicionar campos opcionais baseados no método de pagamento
        if (formData.token) mpPayload.token = formData.token;
        if (formData.installments) mpPayload.installments = formData.installments;
        if (formData.issuer_id) mpPayload.issuer_id = formData.issuer_id;
        if (formData.point_of_interaction) mpPayload.point_of_interaction = formData.point_of_interaction;

        const paymentResponse = await payment.create({ body: mpPayload });

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
