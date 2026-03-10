import { sendWhatsapp, sendMedia } from "./evolution";
import prisma from "./prisma";

export async function sendWelcomeKit(clientId: string, licenseKey: string, planName: string, whatsapp: string, clientName: string) {
    try {
        const settings = await (prisma as any).settings.findUnique({ where: { id: "global" } });

        const customerGroupUrl = settings?.customerGroupUrl || "https://chat.whatsapp.com/LF7CWKZf5Dx2VGdsTw0aft";
        const communityGroupUrl = settings?.communityGroupUrl || "https://chat.whatsapp.com/JhkL3WD8Yn9LXpO8cglXwY";
        const extensionUrl = settings?.extensionUrl || "https://mega2ai.com/download/mega_2ai_latest.zip";
        const videoUrl = settings?.videoUrl || "https://mega2ai.com/ajuda";

        const message = `🎉 *Olá, ${clientName}! Seu acesso está liberado!* 🚀\n\n` +
            `Aqui estão os dados para começar agora mesmo:\n\n` +
            `📦 *Plano Ativo:* ${planName}\n` +
            `🔑 *Chave de Acesso:* \`${licenseKey}\` (Clique para copiar)\n\n` +
            `📖 *TUTORIAL DE INSTALAÇÃO:*\n` +
            `${videoUrl}\n\n` +
            `👥 *COMUNIDADE E SUPORTE:*\n` +
            `🔹 Grupo VIP Alunos: ${customerGroupUrl}\n` +
            `🔹 Comunidade Geral: ${communityGroupUrl}\n\n` +
            `_Baixe o arquivo abaixo e siga as instruções do vídeo para instalar seu robô vendedor!_`;

        await sendWhatsapp(whatsapp, message);
        await sendMedia(whatsapp, extensionUrl, "Extensão Mega_2ai 🚀", "mega_2ai.zip");

        return { success: true };
    } catch (error) {
        console.error("Error sending welcome kit:", error);
        throw error;
    }
}
