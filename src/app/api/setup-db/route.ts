import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(req: Request) {
    try {
        console.log("Forçando sincronização do servidor com o Prisma...");

        // Rode o comando do Prisma usando o terminal do servidor real, passando todas as confirmações
        const { stdout, stderr } = await execAsync("npx prisma db push --accept-data-loss");

        console.log("Comando finalizado:", stdout, stderr);

        return NextResponse.json({
            success: true,
            message: "Banco de dados CONSTRUÍDO com sucesso dentro do próprio servidor! As tabelas agora existem.",
            log: stdout,
            aviso: "Pode voltar para a tela /api/auth/setup e gerar seu usuário agora!"
        });

    } catch (error: any) {
        console.error("Erro drástico no DB Setup:", error);
        return NextResponse.json({
            error: "Falha ao forçar as tabelas",
            message: error.message,
            saida: error.stdout?.toString()
        }, { status: 500 });
    }
}
