import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWelcomeKit } from "@/lib/notifications";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const client = await (prisma as any).client.findUnique({
            where: { id },
            include: {
                licenses: {
                    include: { plan: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!client) {
            return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
        }

        const license = client.licenses[0];
        if (!license) {
            return NextResponse.json({ error: "Este cliente não possui uma licença ativa." }, { status: 400 });
        }

        await sendWelcomeKit(
            client.id,
            license.key,
            license.plan.name,
            client.whatsapp,
            client.name
        );

        return NextResponse.json({ success: true, message: "Acesso enviado com sucesso!" });
    } catch (error: any) {
        console.error("Send Access Error:", error);
        return NextResponse.json({ error: "Erro ao enviar acesso", details: error.message }, { status: 500 });
    }
}
