import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWhatsapp } from "@/lib/evolution";

export async function POST(req: Request) {
    try {
        const { username } = await req.json();

        // 1. Procurar o admin pelo username fornecido
        const admin = await (prisma as any).admin.findUnique({
            where: { username }
        });

        if (!admin) {
            return NextResponse.json({ error: "Administrator not found" }, { status: 404 });
        }

        // 2. Gerar uma nova senha segura aleatória
        const newPassword = Math.random().toString(36).slice(-8).toUpperCase();
        const hashedPass = await bcrypt.hash(newPassword, 10);

        // 3. Salvar nova senha no banco de dados
        await (prisma as any).admin.update({
            where: { id: admin.id },
            data: { password: hashedPass }
        });

        // 4. Enviar a nova senha para o WhatsApp do Dono do Sistema (ADMIN_WHATSAPP)
        const adminPhone = process.env.ADMIN_WHATSAPP;

        if (adminPhone) {
            const message = `🚨 *RECUPERAÇÃO DE SENHA SOLICITADA*\n\n` +
                `O acesso ao painel do usuário *${username}* foi redefinido.\n\n` +
                `🔑 *Sua Nova Senha:* ${newPassword}\n\n` +
                `⚠️ _Recomendamos usar essa senha para entrar no painel e depois trocá-la nas configurações se desejar._`;

            await sendWhatsapp(adminPhone, message);
        }

        return NextResponse.json({ success: true, message: "Senha enviada para o administrador raiz." });

    } catch (error: any) {
        console.error("Recover Password Error:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
