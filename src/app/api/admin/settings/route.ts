import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Usamos (prisma as any) para evitar erros de tipagem no client antes do generate
        const settings = await (prisma as any).settings.upsert({
            where: { id: "global" },
            update: {},
            create: {
                id: "global",
                extensionUrl: "https://mega2ai.com/download/mega_2ai_v2.zip",
                customerGroupName: "Grupo VIP de Alunos",
                customerGroupUrl: "https://chat.whatsapp.com/LF7CWKZf5Dx2VGdsTw0aft",
                communityGroupName: "Comunidade Mega_2ai",
                communityGroupUrl: "https://chat.whatsapp.com/JhkL3WD8Yn9LXpO8cglXwY",
                videoUrl: "https://youtube.com/link-do-tutorial"
            }
        });
        return NextResponse.json(settings);
    } catch (error) {
        console.error("GET Settings Error:", error);
        return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const settings = await (prisma as any).settings.upsert({
            where: { id: "global" },
            update: {
                extensionUrl: body.extensionUrl,
                customerGroupUrl: body.customerGroupUrl,
                communityGroupUrl: body.communityGroupUrl,
                customerGroupName: body.customerGroupName,
                communityGroupName: body.communityGroupName,
                videoUrl: body.videoUrl,
            },
            create: {
                id: "global",
                extensionUrl: body.extensionUrl,
                customerGroupUrl: body.customerGroupUrl,
                communityGroupUrl: body.communityGroupUrl,
                customerGroupName: body.customerGroupName,
                communityGroupName: body.communityGroupName,
                videoUrl: body.videoUrl,
            }
        });
        return NextResponse.json(settings);
    } catch (error) {
        console.error("PATCH Settings Error:", error);
        return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 });
    }
}
