import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
    try {
        const username = "carlos";
        const password = "mega2ai@2026"; // Senha padrão
        const hashedPass = await bcrypt.hash(password, 10);

        await (prisma as any).admin.upsert({
            where: { username },
            update: { password: hashedPass },
            create: {
                username,
                password: hashedPass,
                name: "Carlos Administrador",
            }
        });

        return NextResponse.json({
            success: true,
            message: "Usuário gerado com sucesso direto no Banco de Dados!",
            usuario: username,
            senha: password
        });

    } catch (error: any) {
        console.error("Setup Admin Error:", error);
        return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
    }
}
