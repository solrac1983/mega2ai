import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
    try {
        console.log("Iniciando Seed do Banco de Dados...");

        // Rodar o comando de seed definido no package.json
        const { stdout, stderr } = await execAsync("npx prisma db seed");

        console.log("Seed finalizado:", stdout, stderr);

        return NextResponse.json({
            success: true,
            message: "Banco de dados POPULADO com os planos padrão!",
            log: stdout,
            error: stderr
        });

    } catch (error: any) {
        console.error("Erro no Seed:", error);
        return NextResponse.json({
            error: "Falha ao rodar o seed",
            message: error.message,
            output: error.stdout?.toString()
        }, { status: 500 });
    }
}
