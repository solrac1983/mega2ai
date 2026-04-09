"use client";

import { motion } from "framer-motion";
import { Suspense } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ThankYouContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan");

    const groupLink = plan === "free"
        ? "https://chat.whatsapp.com/JhkL3WD8Yn9LXpO8cglXwY"
        : "https://chat.whatsapp.com/LF7CWKZf5Dx2VGdsTw0aft";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card max-w-2xl w-full p-12 rounded-[40px] text-center relative z-10 border border-white/5"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.2 }}
                className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(6,182,212,0.4)]"
            >
                <CheckCircle2 className="w-12 h-12 text-slate-950" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
                Pagamento <span className="text-cyan-400">Confirmado!</span>
            </h1>

            <p className="text-slate-400 text-lg mb-12 max-w-md mx-auto leading-relaxed">
                Sua licença do <span className="text-white font-bold">mega_2ai</span> foi gerada com sucesso e enviada agora mesmo para o seu <span className="text-white font-bold">WhatsApp</span>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 text-left"
                >
                    <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                        O que fazer agora?
                    </h3>
                    <p className="text-slate-400 text-sm">
                        Confira seu WhatsApp. Você recebeu a chave de ativação e o arquivo para instalação.
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 text-left"
                >
                    <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                        Precisa de ajuda?
                    </h3>
                    <p className="text-slate-400 text-sm">
                        Entre no nosso grupo exclusivo para suporte e atualizações importantes.
                    </p>
                </motion.div>
            </div>

            <div className="flex flex-col gap-4">
                <a href={groupLink} target="_blank" rel="noopener noreferrer" className="w-full">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-cyan-500 text-black py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(6,182,212,0.2)]"
                    >
                        <MessageCircle className="w-5 h-5" />
                        {plan === "free" ? "Entrar no Grupo de Acessos" : "Entrar no Grupo de Clientes"}
                    </motion.button>
                </a>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
                    <Link href="/" className="w-full sm:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest border border-white/10 transition-colors"
                        >
                            Voltar para o site
                        </motion.button>
                    </Link>

                    <a href="https://wa.me/5584996706253" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto text-slate-400 hover:text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
                        >
                            Falar com Suporte
                        </motion.button>
                    </a>
                </div>
            </div>
        </motion.div>
    );
}

export default function ThankYouPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />

            <Suspense fallback={<div className="text-white">Carregando...</div>}>
                <ThankYouContent />
            </Suspense>
        </main>
    );
}
