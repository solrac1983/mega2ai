import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const plans = await prisma.plan.findMany({
            orderBy: { durationDays: 'asc' }
        });
        return NextResponse.json(plans);
    } catch (error) {
        console.error("Plans GET Error:", error);
        return NextResponse.json({ error: "Erro ao carregar planos" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const plans = await req.json();

        if (!Array.isArray(plans)) {
            return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
        }

        // Atualizar todos os planos na transação
        const updatePromises = plans.map((plan: any) =>
            prisma.plan.update({
                where: { id: plan.id },
                data: {
                    name: plan.name,
                    price: parseFloat(plan.price),
                    description: plan.description || "",
                    durationDays: plan.durationDays === null ? null : parseInt(plan.durationDays, 10),
                }
            })
        );

        await Promise.all(updatePromises);

        return NextResponse.json({ success: true, message: "Planos atualizados" });

    } catch (error) {
        console.error("Plans PUT Error:", error);
        return NextResponse.json({ error: "Erro ao atualizar planos" }, { status: 500 });
    }
}
