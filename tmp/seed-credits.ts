import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const creditPlans = [
    { id: 'credits_100', name: '100 Créditos', price: 59.90, credits: 100, type: 'CREDITS', description: 'Pacote Essencial para projetos rápidos' },
    { id: 'credits_200', name: '200 Créditos', price: 99.90, credits: 200, type: 'CREDITS', description: 'Dobro de poder para maior autonomia' },
    { id: 'credits_300', name: '300 Créditos', price: 139.90, credits: 300, type: 'CREDITS', description: 'Recomendado para desenvolvedores ativos' },
    { id: 'credits_500', name: '500 Créditos', price: 189.90, credits: 500, type: 'CREDITS', description: 'Escala e performance para seus projetos' },
    { id: 'credits_1000', name: '1000 Créditos', price: 299.90, credits: 1000, type: 'CREDITS', description: 'O melhor custo-benefício profissional' },
    { id: 'credits_2000', name: '2000 Créditos', price: 599.90, credits: 2000, type: 'CREDITS', description: 'Pacote Enterprise para alta demanda' },
    { id: 'credits_5000', name: '5000 Créditos', price: 899.90, credits: 5000, type: 'CREDITS', description: 'Poder Ilimitado para agências e times' },
];

async function main() {
    console.log('Iniciando seed de créditos...');
    for (const plan of creditPlans) {
        await prisma.plan.upsert({
            where: { id: plan.id },
            update: {
                name: plan.name,
                price: plan.price,
                credits: plan.credits,
                type: plan.type as any,
                description: plan.description
            },
            create: {
                id: plan.id,
                name: plan.name,
                price: plan.price,
                credits: plan.credits,
                type: plan.type as any,
                description: plan.description
            },
        });
        console.log(`- Plano ${plan.name} sincronizado.`);
    }
    console.log('Seed finalizado com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
