import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function validateCoupon(code: string, planId: string) {
    console.log(`Testing with code: ${code}, planId: ${planId}`);

    const coupon = await (prisma as any).coupon.findUnique({
        where: { code: code.toUpperCase() }
    });

    if (!coupon) {
        console.log("Error: Coupon not found");
        return;
    }

    const plan = await (prisma as any).plan.findUnique({
        where: { id: planId }
    });

    if (!plan) {
        console.log("Error: Plan not found");
        return;
    }

    console.log("Success! Plan Price:", plan.price, "Coupon Value:", coupon.discountValue);
}

async function main() {
    // Create a dummy coupon for testing
    try {
        await (prisma as any).coupon.upsert({
            where: { code: "MEGA90" },
            update: {},
            create: {
                code: "MEGA90",
                discountValue: 90,
                isPercentage: true,
                active: true
            }
        });
        console.log("Coupon MEGA90 created for local test.");

        await validateCoupon("MEGA90", "30days");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
