import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const settings = await (prisma as any).settings.findUnique({
            where: { id: "global" }
        });

        if (!settings) {
            return NextResponse.json({ error: "Configurações não encontradas" }, { status: 404 });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Public Settings GET Error:", error);
        return NextResponse.json({ error: "Erro ao carregar configurações" }, { status: 500 });
    }
}
