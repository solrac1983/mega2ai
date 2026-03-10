import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("--- PLANS ---");
    const plans = await prisma.plan.findMany();
    console.log(plans);

    console.log("\n--- COUPONS ---");
    const coupons = await (prisma as any).coupon.findMany();
    console.log(coupons);

    await prisma.$disconnect();
}

main();
