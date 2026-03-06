import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const clients = await prisma.client.findMany();
    console.log(JSON.stringify(clients, null, 2));
}
main().finally(() => prisma.$disconnect());
