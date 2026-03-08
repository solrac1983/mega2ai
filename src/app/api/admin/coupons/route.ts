import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const coupons = await (prisma as any).coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(coupons);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar cupons" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();

        let expiresAt = null;
        if (data.expiresDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(data.expiresDays, 10));
        }

        const coupon = await (prisma as any).coupon.create({
            data: {
                code: data.code.toUpperCase(),
                discountValue: parseFloat(data.discountValue),
                isPercentage: data.isPercentage ?? true,
                expiresAt: expiresAt,
                active: true
            }
        });
        return NextResponse.json(coupon);
    } catch (error) {
        return NextResponse.json({ error: "Erro criacão do cupom. Verifique se o código já existe." }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        await (prisma as any).coupon.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Erro deletando cupom." }, { status: 500 });
    }
}
