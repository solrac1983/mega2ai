import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        // Buscar admin no banco de dados
        const admin = await (prisma as any).admin.findUnique({
            where: { username }
        });

        if (!admin) {
            return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
        }

        const response = NextResponse.json({ success: true });

        // Set a cookie that expires in 24 hours
        (await cookies()).set("admin_session", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
    }
}
