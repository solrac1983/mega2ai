"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, User, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                window.location.href = "/admin";
            } else {
                setError("Usuário ou senha incorretos");
            }
        } catch {
            setError("Erro ao conectar com o servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass-card max-w-md w-full p-8 md:p-12 rounded-[40px] border border-white/5 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldCheck className="w-32 h-32" />
                </div>

                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
                        <ShieldCheck className="w-10 h-10 text-cyan-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                        Acesso <span className="text-cyan-500">Restrito</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Painel de Administração Mega_2ai</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Usuário</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                                <User className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-12 py-5 text-white placeholder:text-slate-700 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all outline-none"
                                placeholder="Seu usuário"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Senha</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-12 py-5 text-white placeholder:text-slate-700 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-red-500 text-xs font-bold text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20"
                        >
                            {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-500 text-slate-950 font-black py-5 rounded-2xl hover:bg-cyan-400 transform transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(6,182,212,0.2)]"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "ENTRAR NO PAINEL"}
                    </button>
                </form>

                <p className="text-center text-slate-600 text-[10px] mt-10 uppercase tracking-widest font-bold">
                    &copy; 2026 MEGA_2AI - SISTEMA PROTEGIDO
                </p>
            </motion.div>
        </main>
    );
}
