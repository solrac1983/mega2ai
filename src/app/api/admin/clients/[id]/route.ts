import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name, email, whatsapp, planId } = await req.json();

        const client = await prisma.client.update({
            where: { id },
            data: { name, email, whatsapp },
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

                let licenseKey = `MNL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const existingLicense = await prisma.license.findFirst({ where: { clientId: id } });

                if (existingLicense) {
                    licenseKey = existingLicense.key;
                    await prisma.license.update({
                        where: { id: existingLicense.id },
                        data: { planId, expiresAt, status: "ACTIVE" }
                    });
                } else {
                    await prisma.license.create({
                        data: {
                            clientId: id,
                            planId: plan.id,
                            key: licenseKey,
                            status: "ACTIVE",
                            expiresAt
                        }
                    });
                }

                // Notificar Cliente sobre a Licença Manual/Atualizada
                try {
                    const { sendWhatsapp } = await import("@/lib/evolution");
                    const message = `🛠️ *Atualização de Acesso!* \n\n` +
                        `Olá ${client.name}, seu plano foi atualizado pelo administrador.\n\n` +
                        `📦 *Novo Plano:* ${plan.name}\n` +
                        `🔑 *Sua Chave:* \`${licenseKey}\`\n\n` +
                        `Acesse sua extensão agora para verificar seu novo período de uso! 🚀`;

                    await sendWhatsapp(client.whatsapp, message);
                } catch (waError) {
                    console.error("Erro ao enviar WhatsApp manual:", waError);
                }
            }
        }

        return NextResponse.json(client);
    } catch (error: any) {
        console.error("Update Client Error:", error);
        return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.$transaction([
            prisma.payment.deleteMany({ where: { clientId: id } }),
            prisma.license.deleteMany({ where: { clientId: id } }),
            prisma.client.delete({ where: { id } }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete Client Error:", error);
        return NextResponse.json({ error: "Erro ao excluir cliente" }, { status: 500 });
    }
}
