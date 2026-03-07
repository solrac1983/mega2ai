import { NextResponse } from "next/server";
import { createPicPayPayment } from "@/lib/picpay";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { planId, planName, price, clientInfo } = body;
        const { name, email, whatsapp, document } = clientInfo;

        console.log("💳 [PicPay Process] Iniciando:", { planName, email });

        // 1. Criar/Atualizar cliente no banco
        const client = await (prisma as any).client.upsert({
            where: { email },
            update: { name, whatsapp },
            create: { name, email, whatsapp },
        });

        // 2. Preparar dados do comprador
        const names = name.trim().split(" ");
        const firstName = names[0];
        const lastName = names.length > 1 ? names.slice(1).join(" ") : "Cliente";

        const baseUrl = process.env.NEXT_PUBLIC_URL || "https://mega2ai.com";

        // 3. Criar pagamento no PicPay
        const picpayResponse = await createPicPayPayment({
            referenceId: `${client.id}_${Date.now()}`,
            callbackUrl: `${baseUrl}/api/webhooks/picpay`,
            returnUrl: `${baseUrl}/success`,
            value: Number(price.replace(',', '.')),
            buyer: {
                firstName,
                lastName,
                document: document || "000.000.000-00",
                email,
                phone: whatsapp
            }
        });

        console.log("✅ [PicPay Process] Criado:", picpayResponse.paymentId);

        return NextResponse.json({
            status: "pending",
            id: picpayResponse.paymentId,
            qr_code: picpayResponse.qrcode?.content,
            qr_code_base64: picpayResponse.qrcode?.base64?.replace(/^data:image\/[a-z]+;base64,/, ''),
            payment_url: picpayResponse.paymentUrl
        });

    } catch (error: any) {
        console.error("❌ [PicPay Process] ERRO:", error);
        return NextResponse.json({
            error: "Erro ao processar PicPay",
            details: error.message
        }, { status: 500 });
    }
}
