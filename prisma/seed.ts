import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seed() {
    const plansData = [
        { id: "1day", name: "1 dia", price: 49.90, durationDays: 1 },
        { id: "7days", name: "7 dias", price: 79.90, durationDays: 7 },
        { id: "30days", name: "30 dias", price: 159.90, durationDays: 30 },
        { id: "lifetime", name: "Vitalício", price: 599.90, durationDays: null },
    ];

    for (const plan of plansData) {
        await prisma.plan.upsert({
            where: { id: plan.id },
            update: plan,
            create: plan,
        });
    }

    // Inicializar Admin inicial
    const adminUser = process.env.ADMIN_USER || "admin";
    const adminPass = process.env.ADMIN_PASS || "mega2ai@2026";
    const hashedPass = await bcrypt.hash(adminPass, 10);

    await (prisma as any).admin.upsert({
        where: { username: adminUser },
        update: {},
        create: {
            username: adminUser,
            password: hashedPass,
            name: "Administrador"
        }
    });

    return { plans: plansData.length };
}

if (require.main === module) {
    seed()
        .then(() => {
            console.log("Seed concluído!");
            process.exit(0);
        })
        .catch((e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
