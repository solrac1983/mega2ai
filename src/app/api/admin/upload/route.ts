import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define o caminho de upload: public/download
        const uploadDir = join(process.cwd(), "public", "download");

        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }

        // Nome fixo para facilitar ou manter o original
        const fileName = file.name || "mega_2ai_latest.zip";
        const path = join(uploadDir, fileName);

        await writeFile(path, buffer);

        // Atualiza a URL nas configurações globais
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const host = req.headers.get("host");
        const newUrl = `${protocol}://${host}/download/${fileName}`;

        await prisma.settings.upsert({
            where: { id: "global" },
            update: { extensionUrl: newUrl },
            create: {
                id: "global",
                extensionUrl: newUrl
            }
        });

        return NextResponse.json({
            success: true,
            url: newUrl,
            message: "Arquivo enviado e URL atualizada com sucesso!"
        });
    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Erro ao processar upload" }, { status: 500 });
    }
}
