import axios from "axios";

const url = process.env.EVOLUTION_API_URL;
const key = process.env.EVOLUTION_API_KEY;
const instance = process.env.EVOLUTION_INSTANCE;

const evolution = axios.create({
    baseURL: url,
    headers: {
        apikey: key,
        "Content-Type": "application/json",
    },
});

export async function sendWhatsapp(number: string, text: string) {
    try {
        const cleanNumber = number.replace(/\D/g, "");
        const instancePath = encodeURIComponent(instance || "");

        await evolution.post(`/message/sendText/${instancePath}`, {
            number: cleanNumber,
            text: text,
            delay: 1200,
            linkPreview: true
        });

        console.log(`Mensagem enviada para ${cleanNumber}`);
        return true;
    } catch (error: any) {
        console.error("Evolution API Error:", error.response?.data || error.message);
        return false;
    }
}

export async function sendMedia(number: string, mediaUrl: string, caption: string, fileName: string) {
    try {
        const cleanNumber = number.replace(/\D/g, "");
        const instancePath = encodeURIComponent(instance || "");

        await evolution.post(`/message/sendMedia/${instancePath}`, {
            number: cleanNumber,
            mediatype: "document",
            media: mediaUrl,
            caption: caption,
            fileName: fileName
        });

        console.log(`Mídia enviada para ${cleanNumber}`);
        return true;
    } catch (error: any) {
        console.error("Evolution API Media Error:", error.response?.data || error.message);
        return false;
    }
}
