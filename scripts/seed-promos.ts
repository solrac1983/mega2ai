import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Populando planos com dados promocionais e créditos...");

    // Encontrar todos os planos
    const plans = await prisma.plan.findMany();

    for (const plan of plans) {
        let originalPrice = null;
        let credits = null;
        let type = plan.type;

        // Se for um plano comum, vamos simular uma promoção
        if (typeof plan.price === 'number') {
            originalPrice = plan.price * 1.35; // +35% de desconto simulado
        }

        // Se o nome do plano contiver "Créditos" ou for o ID de créditos, mudar o tipo
        if (plan.id.includes('credits') || plan.name.toLowerCase().includes('créditos')) {
            type = 'CREDITS';
            credits = 1000; // Valor padrão de demonstração
        }

        await prisma.plan.update({
            where: { id: plan.id },
            data: {
                originalPrice: originalPrice,
                credits: credits,
                type: type
            }
        });
        console.log(`✅ Plano atualizado: ${plan.name} (Habilitado Promoção/Créditos)`);
    }

    // Criar um plano de exemplo de créditos se não existir
    const creditPlanId = 'credits_ext_1000';
    await prisma.plan.upsert({
        where: { id: creditPlanId },
        update: {
            name: "Pacote 1000 Créditos",
            price: 29.90,
            originalPrice: 49.90,
            type: 'CREDITS',
            credits: 1000,
            description: "Créditos para uso imediato na extensão."
        },
        create: {
            id: creditPlanId,
            name: "Pacote 1000 Créditos",
            price: 29.90,
            originalPrice: 49.90,
            type: 'CREDITS',
            credits: 1000,
            description: "Créditos para uso imediato na extensão."
        }
    });

    console.log("Seed concluído com sucesso!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
