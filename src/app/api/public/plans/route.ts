import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const plans = await prisma.plan.findMany({
            orderBy: { price: 'asc' }
        });
        return NextResponse.json(plans);
    } catch (error) {
        console.error("Public Plans GET Error:", error);
        return NextResponse.json({ error: "Erro ao carregar planos" }, { status: 500 });
    }
}
