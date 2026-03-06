const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.settings.upsert({
        where: { id: "global" },
        update: {},
        create: {
            id: "global",
            extensionUrl: "https://mega2ai.com/download/mega_2ai_v2.zip",
            customerGroupUrl: "https://chat.whatsapp.com/LF7CWKZf5Dx2VGdsTw0aft",
            communityGroupUrl: "https://chat.whatsapp.com/JhkL3WD8Yn9LXpO8cglXwY",
            videoUrl: "https://youtube.com/link-do-tutorial"
        }
    });
    console.log("Settings created/updated:", settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
