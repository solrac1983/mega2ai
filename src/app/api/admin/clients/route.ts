import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            include: {
                payments: {
                    orderBy: { createdAt: "desc" },
                    take: 5
                },
                licenses: {
                    include: { plan: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(clients);
    } catch (error) {
        console.error("Clients API Error:", error);
        return NextResponse.json({ error: "Erro ao carregar clientes" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, email, whatsapp, planId } = await req.json();

        if (!name || !email || !whatsapp) {
            return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
        }

        // Verificar se já existe
        const existing = await prisma.client.findFirst({
            where: {
                OR: [
                    { email },
                    { whatsapp }
                ]
            }
        });

        if (existing) {
            return NextResponse.json({
                error: existing.email === email ? "Este e-mail já está cadastrado." : "Este WhatsApp já está cadastrado."
            }, { status: 400 });
        }

        const client = await prisma.client.create({
            data: { name, email, whatsapp }
        });

        if (planId) {
            const plan = await prisma.plan.findUnique({ where: { id: planId } });
            if (plan) {
                let expiresAt = null;
                if (plan.durationDays) {
                    expiresAt = new Date();
                    if (plan.id === "free") {
                        expiresAt.setMinutes(expiresAt.getMinutes() + plan.durationDays);
                    } else {
                        expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
                    }
                }

                const licenseKey = `MNL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                await prisma.license.create({
                    data: {
                        clientId: client.id,
                        planId: plan.id,
                        key: licenseKey,
                        status: "ACTIVE",
                        expiresAt
                    }
                });

                // Notificar Cliente (Kit Completo)
                try {
                    const { sendWelcomeKit } = await import("@/lib/notifications");
                    await sendWelcomeKit(
                        client.id,
                        licenseKey,
                        plan.name,
                        client.whatsapp,
                        client.name
                    );
                } catch (waError) {
                    console.error("Erro ao enviar WhatsApp kit boas-vindas:", waError);
                }
            }
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error("Client POST Error:", error);
        return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
    }
}
