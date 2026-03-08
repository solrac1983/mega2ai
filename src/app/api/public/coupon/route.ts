import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { code, planId } = await req.json();

        if (!code || !planId) {
            return NextResponse.json({ error: "Cupom e plano obrigatórios" }, { status: 400 });
        }

        const coupon = await (prisma as any).coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon || !coupon.active) {
            return NextResponse.json({ error: "Cupom inválido ou inativo" }, { status: 400 });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json({ error: "Cupom expirado" }, { status: 400 });
        }

        const plan = await (prisma as any).plan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
        }

        let discountAmount = 0;
        if (coupon.isPercentage) {
            discountAmount = (plan.price * coupon.discountValue) / 100;
        } else {
            discountAmount = coupon.discountValue;
        }

        let newPrice = plan.price - discountAmount;
        if (newPrice < 0) newPrice = 0;

        return NextResponse.json({
            success: true,
            couponId: coupon.id,
            discountAmount: discountAmount,
            discountedPrice: newPrice,
            originalPrice: plan.price
        });

    } catch (error) {
        console.error("Coupon Validate Error:", error);
        return NextResponse.json({ error: "Erro ao validar cupom" }, { status: 500 });
    }
}
