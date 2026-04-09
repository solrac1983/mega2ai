import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsapp } from "@/lib/evolution";

export async function POST(req: Request) {
    try {
        const { clientIds, message } = await req.json();

        if (!clientIds || !Array.isArray(clientIds) || !message) {
            return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
        }

        const clients = await (prisma as any).client.findMany({
            where: {
                id: { in: clientIds }
            },
            select: { whatsapp: true }
        });

        if (clients.length === 0) {
            return NextResponse.json({ error: "Nenhum cliente encontrado" }, { status: 404 });
        }

        // Loop de envio (idealmente usar uma fila/queue em produção, mas para poucos clientes o loop resolve)
        const results = await Promise.allSettled(
            clients.map((client: any) => sendWhatsapp(client.whatsapp, message))
        );

        const successCount = results.filter(r => (r as any).status === "fulfilled" && (r as any).value === true).length;
        const totalSent = results.length;
        const failCount = totalSent - successCount;

        return NextResponse.json({
            success: true,
            message: `Envio concluído: ${successCount} sucessos, ${failCount} falhas.`,
            stats: { successCount, failCount, totalSent }
        });
    } catch (error) {
        console.error("Notify Error:", error);
        return NextResponse.json({ error: "Erro ao enviar notificações" }, { status: 500 });
    }
}
