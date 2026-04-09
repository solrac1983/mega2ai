import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalClients,
            approvedPayments,
            freeTrials,
            recentClients,
            salesByPlan,
            totalAdmins,
            monthlyRevenueData,
            couponsUsage
        ] = await Promise.all([
            prisma.client.count(),
            prisma.payment.findMany({
                where: { status: "APPROVED" },
                select: { amount: true }
            }),
            prisma.license.count({
                where: { planId: "free" }
            }),
            prisma.client.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    whatsapp: true,
                    createdAt: true
                }
            }),
            prisma.payment.groupBy({
                by: ['amount'],
                where: { status: "APPROVED" },
                _count: { id: true },
                _sum: { amount: true }
            }),
            (prisma as any).admin.count(),
            prisma.payment.findMany({
                where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
                select: { amount: true }
            }),
            (prisma as any).coupon.findMany({
                orderBy: { usedCount: 'desc' },
                take: 5
            })
        ]);

        const totalRevenue = approvedPayments.reduce((acc, curr) => acc + curr.amount, 0);
        const monthlyRevenue = monthlyRevenueData.reduce((acc, curr) => acc + curr.amount, 0);
        const paidConversions = approvedPayments.filter(p => p.amount > 0).length;
        const conversionRate = totalClients > 0 ? (paidConversions / totalClients) * 100 : 0;

        return NextResponse.json({
            stats: {
                totalClients,
                approvedSales: paidConversions,
                freeTrials,
                totalRevenue,
                totalAdmins,
                monthlyRevenue,
                conversionRate: conversionRate.toFixed(2),
            },
            recentClients,
            salesByPlan: salesByPlan.filter(p => p.amount > 0),
            topCoupons: couponsUsage
        });
    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 });
    }
}
