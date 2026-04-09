const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando Correção Nuclear de Dados...");

    // 1. Criar/Resetar Admin
    const username = "carlos";
    const password = "admin123";
    const name = "Carlos Admin";
    const hashedPass = await bcrypt.hash(password, 10);

    await prisma.admin.upsert({
        where: { username },
        update: { password: hashedPass, name },
        create: { username, password: hashedPass, name }
    });
    console.log("✅ Admin 'carlos' / 'admin123' ativado.");

    // 2. Popular Planos com Promoção
    const plans = await prisma.plan.findMany();
    for (const plan of plans) {
        let originalPrice = null;
        if (typeof plan.price === 'number') {
            originalPrice = plan.price * 1.5;
        }
        
        await prisma.plan.update({
            where: { id: plan.id },
            data: { 
                originalPrice,
                type: (plan.id.includes('credits') || plan.name.toLowerCase().includes('créditos')) ? 'CREDITS' : 'LICENSE'
            }
        });
        console.log(`✅ Promoção ativada: ${plan.name}`);
    }

    console.log("🚀 Sistema 100% Corrigido e Sincronizado!");
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
