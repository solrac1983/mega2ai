import { NextResponse } from "next/server";
import { seed } from "../../../../prisma/seed";

export async function GET() {
    try {
        console.log("Iniciando Seed do Banco de Dados...");

        const result = await seed();

        console.log("Seed finalizado com sucesso!");

        return NextResponse.json({
            success: true,
            message: "Banco de dados POPULADO com os planos padrão!",
            result
        });

    } catch (error: any) {
        console.error("Erro no Seed:", error);
        return NextResponse.json({
            error: "Falha ao rodar o seed",
            message: error.message
        }, { status: 500 });
    }
}
