import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seed() {
    const plansData = [
        // Licenças
        { id: "1day", name: "1 dia", price: 49.90, durationDays: 1, type: "LICENSE", credits: null },
        { id: "7days", name: "7 dias", price: 79.90, durationDays: 7, type: "LICENSE", credits: null },
        { id: "30days", name: "30 dias", price: 159.90, durationDays: 30, type: "LICENSE", credits: null },
        { id: "lifetime", name: "Vitalício", price: 599.90, durationDays: null, type: "LICENSE", credits: null },
        // Créditos
        { id: 'credits_100', name: '100 Créditos', price: 97.00, originalPrice: 149.85, credits: 100, type: 'CREDITS', description: 'Pacote Essencial para projetos rápidos', durationDays: null },
        { id: 'credits_200', name: '200 Créditos', price: 187.80, originalPrice: 284.85, credits: 200, type: 'CREDITS', description: 'Dobro de poder para maior autonomia', durationDays: null },
        { id: 'credits_300', name: '300 Créditos', price: 277.00, originalPrice: 449.85, credits: 300, type: 'CREDITS', description: 'Recomendado para desenvolvedores ativos', durationDays: null },
        { id: 'credits_500', name: '500 Créditos', price: 387.00, originalPrice: 599.85, credits: 500, type: 'CREDITS', description: 'Escala e performance para seus projetos', durationDays: null },
        { id: 'credits_1000', name: '1000 Créditos', price: 487.00, originalPrice: 899.85, credits: 1000, type: 'CREDITS', description: 'O melhor custo-benefício profissional', durationDays: null },
        { id: 'credits_2000', name: '2000 Créditos', price: 587.00, originalPrice: 1199.85, credits: 2000, type: 'CREDITS', description: 'Pacote Enterprise para alta demanda', durationDays: null },
        { id: 'credits_5000', name: '5000 Créditos', price: 1387.00, originalPrice: 2399.85, credits: 5000, type: 'CREDITS', description: 'Poder Ilimitado para agências e times', durationDays: null },
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
