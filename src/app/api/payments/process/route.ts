import { NextResponse } from "next/server";
import { mpClient } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { formData, planId, planName, clientInfo } = body;
        const { name, email, whatsapp } = clientInfo;

        console.log("💳 [Payment Process] Iniciando processamento:", {
            planName,
            email,
            payment_method_id: formData.payment_method_id
        });

        // 1. Criar/Atualizar cliente no banco
        const client = await (prisma as any).client.upsert({
            where: { email },
            update: { name, whatsapp },
            create: { name, email, whatsapp },
        });

        // 2. Preparar payload do Mercado Pago
        const [firstName, ...lastNameParts] = name.split(" ");
        const lastName = lastNameParts.join(" ") || "Cliente";

        const mpPayload: any = {
            transaction_amount: Number(formData.transaction_amount),
            description: `mega_2ai - Plano ${planName}`,
            payment_method_id: formData.payment_method_id,
            payer: {
                email: email,
                first_name: firstName,
                last_name: lastName,
                identification: formData.payer?.identification,
            },
            notification_url: `${process.env.WEBHOOK_URL}/api/webhooks/mercadopago`,
            external_reference: client.id,
            installments: formData.installments ? Number(formData.installments) : 1,
            issuer_id: formData.issuer_id,
            token: formData.token,
        };

        // Adicionar informações do ponto de interação (Pix)
        if (formData.point_of_interaction) {
            mpPayload.point_of_interaction = formData.point_of_interaction;
        }

        console.log("📦 [Payment Process] Payload MP:", JSON.stringify(mpPayload, null, 2));

        const payment = new Payment(mpClient);
        const paymentResponse = await payment.create({ body: mpPayload });

        console.log("✅ [Payment Process] Resposta MP:", {
            id: paymentResponse.id,
            status: paymentResponse.status,
            status_detail: paymentResponse.status_detail
        });

        return NextResponse.json({
            status: paymentResponse.status,
            status_detail: paymentResponse.status_detail,
            id: paymentResponse.id,
        });

    } catch (error: any) {
        console.error("❌ [Payment Process] ERRO CRÍTICO:", error);

        // Tentar extrair detalhes específicos do erro do Mercado Pago
        let errorMessage = "Verifique seus dados.";

        // No SDK v2, detalhes costumam vir em error.api_response.body
        const body = error.api_response?.body || error.response?.body;

        if (body?.cause?.[0]?.description) {
            errorMessage = body.cause[0].description;
        } else if (body?.message) {
            errorMessage = body.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({
            error: "Erro ao processar pagamento",
            details: errorMessage,
            mp_details: body || error
        }, { status: 500 });
    }
}
