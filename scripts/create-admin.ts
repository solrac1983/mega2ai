import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const username = "carlos";
    const password = "admin123"; // Troque após o primeiro acesso
    const name = "Carlos Admin";

    console.log(`Criando usuário admin: ${username}...`);

    const hashedPass = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.upsert({
        where: { username },
        update: {
            password: hashedPass,
            name: name
        },
        create: {
            username,
            password: hashedPass,
            name: name
        }
    });

    console.log("Usuário Admin criado/atualizado com sucesso!");
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
