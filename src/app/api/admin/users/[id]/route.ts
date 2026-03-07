import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const updateData: any = {};
        if (body.username) updateData.username = body.username;
        if (body.name) updateData.name = body.name;
        if (body.password) {
            updateData.password = await bcrypt.hash(body.password, 10);
        }

        const admin = await (prisma as any).admin.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(admin);
    } catch (error) {
        console.error("PATCH Admin ID Error:", error);
        return NextResponse.json({ error: "Erro ao atualizar administrador" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Impedir de deletar o último admin
        const count = await (prisma as any).admin.count();
        if (count <= 1) {
            return NextResponse.json({ error: "Não é possível remover o último administrador" }, { status: 400 });
        }

        await (prisma as any).admin.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Admin ID Error:", error);
        return NextResponse.json({ error: "Erro ao remover administrador" }, { status: 500 });
    }
}
