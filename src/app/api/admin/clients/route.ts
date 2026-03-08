import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            include: {
                payments: {
                    orderBy: { createdAt: "desc" },
                    take: 5
                },
                licenses: {
                    include: { plan: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(clients);
    } catch (error) {
        console.error("Clients API Error:", error);
        return NextResponse.json({ error: "Erro ao carregar clientes" }, { status: 500 });
    }
}
