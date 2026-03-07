import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
