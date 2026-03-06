import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        const adminUser = process.env.ADMIN_USER || "admin";
        const adminPass = process.env.ADMIN_PASS || "mega2ai@2026";

        if (username === adminUser && password === adminPass) {
            const response = NextResponse.json({ success: true });

            // Set a cookie that expires in 24 hours
            (await cookies()).set("admin_session", "true", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24,
                path: "/",
            });

            return response;
        }

        return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    } catch {
        return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
    }
}
