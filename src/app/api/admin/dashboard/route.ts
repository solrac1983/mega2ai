import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const [
            totalClients,
            approvedPayments,
            freeTrials,
            recentClients,
            salesByPlan
        ] = await Promise.all([
            prisma.client.count(),
            prisma.payment.findMany({
                where: { status: "APPROVED" },
                select: { amount: true }
            }),
            prisma.payment.count({
                where: { amount: 0, status: "APPROVED" }
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
            })
        ]);

        const totalRevenue = approvedPayments.reduce((acc, curr) => acc + curr.amount, 0);
        const paidConversions = approvedPayments.filter(p => p.amount > 0).length;
        const conversionRate = totalClients > 0 ? (paidConversions / totalClients) * 100 : 0;

        return NextResponse.json({
            stats: {
                totalClients,
                approvedSales: paidConversions,
                freeTrials,
                totalRevenue,
                conversionRate: conversionRate.toFixed(2),
            },
            recentClients,
            salesByPlan: salesByPlan.filter(p => p.amount > 0)
        });
    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 });
    }
}
