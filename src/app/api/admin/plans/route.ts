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

        // Atualizar ou Criar planos na transação
        const updatePromises = plans.map((plan: any) =>
            prisma.plan.upsert({
                where: { id: plan.id },
                create: {
                    id: plan.id,
                    name: plan.name,
                    price: typeof plan.price === 'string' ? parseFloat(plan.price.replace(',', '.')) : plan.price,
                    description: plan.description || "",
                    durationDays: plan.durationDays === null || plan.durationDays === "" ? null : parseInt(plan.durationDays, 10),
                    credits: plan.credits === null || plan.credits === "" ? null : parseInt(plan.credits, 10),
                    type: plan.type || "LICENSE",
                    originalPrice: plan.originalPrice === null || plan.originalPrice === "" ? null : parseFloat(String(plan.originalPrice).replace(',', '.')),
                },
                update: {
                    name: plan.name,
                    price: typeof plan.price === 'string' ? parseFloat(plan.price.replace(',', '.')) : plan.price,
                    description: plan.description || "",
                    durationDays: plan.durationDays === null || plan.durationDays === "" ? null : parseInt(plan.durationDays, 10),
                    credits: plan.credits === null || plan.credits === "" ? null : parseInt(plan.credits, 10),
                    type: plan.type || "LICENSE",
                    originalPrice: plan.originalPrice === null || plan.originalPrice === "" ? null : parseFloat(String(plan.originalPrice).replace(',', '.')),
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

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
        }

        await prisma.plan.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Plano removido com sucesso" });
    } catch (error) {
        console.error("Plans DELETE Error:", error);
        return NextResponse.json({ error: "Erro ao remover plano" }, { status: 500 });
    }
}
