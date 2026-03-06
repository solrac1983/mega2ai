import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendWhatsapp } from "@/lib/evolution";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { clientIds, message } = await req.json();

        if (!clientIds || !Array.isArray(clientIds) || !message) {
            return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
        }

        const clients = await prisma.client.findMany({
            where: {
                id: { in: clientIds }
            },
            select: { whatsapp: true }
        });

        // Loop de envio (idealmente usar uma fila/queue em produção, mas para poucos clientes o loop resolve)
        const results = await Promise.allSettled(
            clients.map(client => sendWhatsapp(client.whatsapp, message))
        );

        const successCount = results.filter(r => r.status === "fulfilled").length;
        const failCount = results.filter(r => r.status === "rejected").length;

        return NextResponse.json({
            success: true,
            message: `Envio concluído: ${successCount} sucessos, ${failCount} falhas.`,
            stats: { successCount, failCount }
        });
    } catch (error) {
        console.error("Notify Error:", error);
        return NextResponse.json({ error: "Erro ao enviar notificações" }, { status: 500 });
    }
}
