import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { key, machineId } = await req.json();

        if (!key || !machineId) {
            return NextResponse.json({ error: "Chave e ID da máquina são obrigatórios" }, { status: 400 });
        }

        const license = await (prisma as any).license.findUnique({
            where: { key },
            include: { client: true, plan: true }
        });

        if (!license) {
            return NextResponse.json({ valid: false, message: "Chave de licença não encontrada" }, { status: 404 });
        }

        // 1. Verificar Status
        if (license.status !== "ACTIVE") {
            return NextResponse.json({ valid: false, message: "Esta licença está desativada ou suspensa" });
        }

        // 2. Verificar Expiração
        if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
            await (prisma as any).license.update({
                where: { id: license.id },
                data: { status: "EXPIRED" }
            });
            return NextResponse.json({ valid: false, message: "Sua licença expirou. Renove para continuar usando." });
        }

        // 3. Bloqueio por Máquina (HWID)
        if (!license.machineId) {
            // Primeiro uso: vincula a máquina
            await (prisma as any).license.update({
                where: { id: license.id },
                data: { machineId, lastUsedAt: new Date() }
            });
        } else if (license.machineId !== machineId) {
            // Tentativa de uso em outra máquina
            return NextResponse.json({
                valid: false,
                message: "Esta licença está vinculada a outro computador. Entre em contato com o suporte para transferir."
            });
        } else {
            // Uso contínuo na mesma máquina
            await (prisma as any).license.update({
                where: { id: license.id },
                data: { lastUsedAt: new Date() }
            });
        }

        const settings = await (prisma as any).settings.findUnique({ where: { id: "global" } });

        return NextResponse.json({
            valid: true,
            message: "Licença validada com sucesso!",
            client: {
                name: license.client.name,
                plan: license.plan.name,
                expiresAt: license.expiresAt
            },
            config: {
                extensionUrl: settings?.extensionUrl,
                customerGroupUrl: settings?.customerGroupUrl
            }
        });

    } catch (error) {
        console.error("Activation Error:", error);
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
    }
}
