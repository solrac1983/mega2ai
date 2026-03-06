import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    const plansData = [
        { id: "free", name: "Teste Grátis", price: 0.00, durationDays: 0 },
        { id: "1day", name: "Acesso 24h", price: 49.90, durationDays: 1 },
        { id: "7days", name: "Semana Turbo", price: 79.90, durationDays: 7 },
        { id: "30days", name: "Expert Mensal", price: 159.90, durationDays: 30 },
        { id: "lifetime", name: "VIP Vitalício", price: 599.90, durationDays: null },
    ];

    for (const plan of plansData) {
        await prisma.plan.upsert({
            where: { id: plan.id },
            update: plan,
            create: plan,
        });
    }

    // Inicializar configurações globais com os links reais fornecidos pelo usuário
    try {
        await (prisma as any).settings.upsert({
            where: { id: "global" },
            update: {
                customerGroupUrl: "https://chat.whatsapp.com/LF7CWKZf5Dx2VGdsTw0aft",
                communityGroupUrl: "https://chat.whatsapp.com/JhkL3WD8Yn9LXpO8cglXwY",
            },
            create: {
                id: "global",
                extensionUrl: "https://mega2ai.com/download/mega_2ai_v2.zip",
                customerGroupUrl: "https://chat.whatsapp.com/LF7CWKZf5Dx2VGdsTw0aft",
                communityGroupUrl: "https://chat.whatsapp.com/JhkL3WD8Yn9LXpO8cglXwY",
            },
        });
    } catch (err) {
        console.log("Aviso: Modelo Settings pode não estar disponível no seed ainda.");
    }

    console.log("Seed concluído: Planos e links iniciais configurados.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
