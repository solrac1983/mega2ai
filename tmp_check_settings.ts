const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.settings.findUnique({ where: { id: "global" } });
    console.log("Current Settings:", settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
