import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "mega_2ai | Domine o Lovable com IA",
  description: "A extensão definitiva para automatizar seu fluxo no Lovable e escalar sua produtividade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        {children}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
