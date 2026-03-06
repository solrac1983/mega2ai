import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const settings = await prisma.settings.upsert({
            where: { id: "global" },
            update: {},
            create: {
                id: "global",
                extensionUrl: "https://mega2ai.com/download/mega_2ai_v2.zip",
                customerGroupUrl: "https://chat.whatsapp.com/LF7CWKZf5Dx2VGdsTw0aft",
                communityGroupUrl: "https://chat.whatsapp.com/JhkL3WD8Yn9LXpO8cglXwY",
            }
        });
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const settings = await prisma.settings.update({
            where: { id: "global" },
            data: {
                extensionUrl: body.extensionUrl,
                customerGroupUrl: body.customerGroupUrl,
                communityGroupUrl: body.communityGroupUrl,
                customerGroupName: body.customerGroupName,
                communityGroupName: body.communityGroupName,
            }
        });
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 });
    }
}
