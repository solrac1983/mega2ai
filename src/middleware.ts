import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Se estiver tentando acessar o admin ou a API do admin
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        // Exceção: Permitir buscar configurações publicamente (Landing Page)
        if (pathname === "/api/admin/settings" && request.method === "GET") {
            return NextResponse.next();
        }

        const session = request.cookies.get("admin_session");

        if (!session) {
            // Se for API, retorna 401
            if (pathname.startsWith("/api/admin")) {
                return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
            }
            // Se for página, redireciona para login
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
