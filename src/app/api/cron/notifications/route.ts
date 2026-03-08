import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsapp } from "@/lib/evolution";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        const [expiring, expired] = await Promise.all([
            // 1. Licenças prestes a expirar (em 3 dias)
            (prisma as any).license.findMany({
                where: {
                    status: "ACTIVE",
                    expiresAt: { lte: threeDaysFromNow, gte: now },
                    notifiedExpiring: false,
                },
                include: { client: true, plan: true }
            }),
            // 2. Licenças que acabaram de expirar
            (prisma as any).license.findMany({
                where: {
                    status: "ACTIVE", // Precisamos marcar como expired e avisar
                    expiresAt: { lte: now },
                    notifiedExpired: false,
                },
                include: { client: true, plan: true }
            })
        ]);

        console.log(`Cron: ${expiring.length} avisos de expiração | ${expired.length} avisos de vencimento`);

        // Processar avisos de expiração (3 dias)
        for (const lic of expiring) {
            const message = `⚠️ *Atenção, ${lic.client.name}!* \n\n` +
                `Sua licença Mega_2ai do plano *${lic.plan.name}* expira em breve!\n` +
                `📅 *Data de Expiração:* ${new Date(lic.expiresAt).toLocaleDateString()}\n\n` +
                `Para não perder o acesso às ferramentas, renove agora com um desconto especial de renovação (Cupom: RENOVA20) no nosso site: https://mega2ai.com/planos \n\n` +
                `Qualquer dúvida, fale com nosso suporte.`;

            await sendWhatsapp(lic.client.whatsapp, message);
            await (prisma as any).license.update({
                where: { id: lic.id },
                data: { notifiedExpiring: true }
            });
        }

        // Processar avisos de já expirado
        for (const lic of expired) {
            const message = `❌ *Sua licença expirou, ${lic.client.name}!* \n\n` +
                `O acesso às ferramentas foi interrompido. Mas não se preocupe, seus dados estão salvos.\n` +
                `Renove agora para voltar a utilizar o Mega_2ai: https://mega2ai.com/planos \n\n` +
                `Te esperamos de volta! 🚀`;

            await sendWhatsapp(lic.client.whatsapp, message);
            await (prisma as any).license.update({
                where: { id: lic.id },
                data: { notifiedExpired: true, status: "EXPIRED" }
            });
        }

        return NextResponse.json({ success: true, alerted: { expiring: expiring.length, expired: expired.length } });

    } catch (error) {
        console.error("Cron Notifications Error:", error);
        return NextResponse.json({ error: "Erro interno no cron" }, { status: 500 });
    }
}
