import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const admins = await (prisma as any).admin.findMany({
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(admins);
    } catch (error) {
        console.error("GET Admins Error:", error);
        return NextResponse.json({ error: "Erro ao buscar administradores" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { username, password, name } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: "Usuário e senha são obrigatórios" }, { status: 400 });
        }

        // Verificar se já existe
        const existing = await (prisma as any).admin.findUnique({
            where: { username }
        });

        if (existing) {
            return NextResponse.json({ error: "Este nome de usuário já está em uso" }, { status: 400 });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await (prisma as any).admin.create({
            data: {
                username,
                password: hashedPassword,
                name
            }
        });

        return NextResponse.json(admin);
    } catch (error) {
        console.error("POST Admin Error:", error);
        return NextResponse.json({ error: "Erro ao criar administrador" }, { status: 500 });
    }
}
