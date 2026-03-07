import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Atualizar cliente
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name, email, whatsapp } = await req.json();

        const client = await prisma.client.update({
            where: { id },
            data: { name, email, whatsapp },
        });

        return NextResponse.json(client);
    } catch (error: any) {
        console.error("Update Client Error:", error);
        return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 });
    }
}

// Excluir cliente
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Antes de excluir o cliente, precisamos lidar com as relações (pagamentos e licenças)
        // Se preferir manter os registros, use soft delete. Aqui faremos a exclusão em cascata manual se necessário
        // ou deixaremos o Prisma disparar erro se houver FK. 
        // Para simplificar e garantir a limpeza:
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
