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
        
        // MODO MOCK PARA DESENVOLVIMENTO (Se não houver token)
        if (!token || token === "") {
            console.warn("⚠️ [MP Process] Token não configurado. Entrando em modo MOCK.");
            const mockPix = "00020126360014br.gov.bcb.pix0114test@mock.com520400005303986540559.905802BR5913MOCK_PAYMENT6008SAO_PAULO62070503***6304ABCD";
            return NextResponse.json({
                qr_code: mockPix,
                // Usamos uma URL real para o QR Code em modo mock
                qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockPix)}`,
                payment_url: "https://mock-payment.com",
                mock: true
            });
        }

        const mpClient = new MercadoPagoConfig({
            accessToken: token,
            options: { timeout: 5000 }
        });
        const payment = new Payment(mpClient);

        // 1. Criar/Atualizar cliente no banco de forma robusta
        let client;
        try {
            // Primeiro busca se o WhatsApp já existe
            client = await (prisma as any).client.findUnique({
                where: { whatsapp },
            });

            if (client) {
                // Se existe, verifica se o email fornecido é diferente e se já pertence a outro usuário
                if (client.email !== email) {
                    const existingEmail = await (prisma as any).client.findUnique({
                        where: { email }
                    });

                    if (existingEmail && existingEmail.id !== client.id) {
                        // Se o email já existe em OUTRA conta, apenas atualiza o nome (mantendo o email original do BD)
                        client = await (prisma as any).client.update({
                            where: { id: client.id },
                            data: { name },
                        });
                    } else {
                        // Se o email é novo ou pertence a esta conta, atualiza ambos
                        client = await (prisma as any).client.update({
                            where: { id: client.id },
                            data: { email, name },
                        });
                    }
                } else {
                    client = await (prisma as any).client.update({
                        where: { id: client.id },
                        data: { name },
                    });
                }
            } else {
                // Se WhatsApp não existe, busca pelo e-mail
                client = await (prisma as any).client.findUnique({
                    where: { email },
                });

                if (client) {
                    // Se o email existe mas com outro WhatsApp, atualiza o nome
                    // Não atualizamos o whatsapp para evitar conflito de unique field se a conta for antiga
                    client = await (prisma as any).client.update({
                        where: { id: client.id },
                        data: { name },
                    });
                } else {
                    // Só cria novo se WhatsApp e Email forem novos
                    client = await (prisma as any).client.create({
                        data: { name, email, whatsapp },
                    });
                }
            }
        } catch (dbError) {
            console.error("❌ Erro DB Cliente:", dbError);
            // Fallback: se tudo falhar, cria um registro temporário falso só para passar o Pix
            client = {
                id: `temp_${Date.now()}`,
                email: email,
                name: name
            };
        }

        // 2. Criar Pix via Mercado Pago Backend API
        const plan = await (prisma as any).plan.findUnique({ where: { id: planId } });
        if (!plan) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

        let priceNumber = Number(plan.price);

        let couponId = null;
        if (clientInfo.couponCode) {
            const coupon = await (prisma as any).coupon.findUnique({ where: { code: clientInfo.couponCode.toUpperCase() } });
            if (coupon && coupon.active && (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date())) {
                const discount = coupon.isPercentage ? (priceNumber * coupon.discountValue) / 100 : coupon.discountValue;
                priceNumber = Math.max(0, priceNumber - discount);
                couponId = coupon.id;
            }
        }

        let cpf = document ? document.replace(/\D/g, "") : "";
        if (cpf.length < 11) cpf = cpf.padStart(11, "0"); // Padroniza CPF
        if (cpf.length > 11) cpf = cpf.substring(0, 11);

        const paymentData = {
            body: {
                transaction_amount: priceNumber,
                description: `Compra - ${planName || "Mega_2ai"}`,
                payment_method_id: "pix",
                payer: {
                    email: client.email.trim(),
                    first_name: name.split(" ")[0] || "Cliente",
                    last_name: name.split(" ").slice(1).join(" ") || "Novo",
                    identification: {
                        type: "CPF",
                        number: cpf
                    }
                },
                external_reference: client.id,
                metadata: {
                    coupon_id: couponId,
                    plan_id: planId
                },
                notification_url: `${process.env.WEBHOOK_URL}/api/webhooks/mercadopago`
            },
            requestOptions: {
                idempotencyKey: `pix_${client.id}_${Date.now()}`
            }
        };

        console.log("Payload MP:", JSON.stringify(paymentData.body));

        const mpResponse = await payment.create(paymentData);

        if (!mpResponse || !(mpResponse as any).point_of_interaction?.transaction_data) {
            console.error("❌ MP QR Code Error:", mpResponse);
            throw new Error("Falha ao extrair QR Code do Mercado Pago");
        }

        const qrCodeData = (mpResponse as any).point_of_interaction.transaction_data;

        // 3. Salvar intenção de pagamento no DB local vinculado ao Plano
        try {
            await (prisma as any).payment.create({
                data: {
                    clientId: client.id,
                    planId: planId,
                    amount: priceNumber,
                    status: "PENDING",
                    mpPaymentId: String(mpResponse.id),
                }
            });
        } catch (dbPayError) {
            console.error("⚠️ Erro ao registrar pagamento inicial:", dbPayError);
            // Seguimos em frente, o webhook pode tentar criar depois se falhar aqui
        }

        return NextResponse.json({
            id: mpResponse.id,
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
