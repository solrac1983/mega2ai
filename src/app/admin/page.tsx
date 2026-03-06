"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Download, Users, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

export default function AdminSettings() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState("");
    const [settings, setSettings] = useState({
        extensionUrl: "",
        customerGroupName: "",
        customerGroupUrl: "",
        communityGroupName: "",
        communityGroupUrl: "",
    });

    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setFetching(false);
            });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setMessage("Configurações atualizadas com sucesso!");
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        // Just clear the cookie (simplest way is calling an API or just redirecting if cookie is set to expire)
        // For simplicity, we can create a logout route or just set document.cookie
        document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.location.href = "/login";
    };

    if (fetching) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white p-8 md:p-20">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <ShieldCheck className="text-cyan-500 w-10 h-10" />
                            Gestão <span className="text-cyan-500">Mega_2ai</span>
                        </h1>
                        <p className="text-slate-500 mt-2 font-mono uppercase text-xs tracking-widest">Painel Administrativo de Links e Arquivos</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                        Sair do Painel
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-8">
                    {/* Arquivo da Extensão */}
                    <section className="glass-card p-8 rounded-3xl border border-white/5 bg-slate-900/40">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Download className="text-emerald-500 w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold uppercase tracking-tight">Arquivo da Extensão</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Link Direto para Download (.zip)</label>
                                <input
                                    type="text"
                                    value={settings.extensionUrl}
                                    onChange={(e) => setSettings({ ...settings, extensionUrl: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-emerald-400 font-mono text-sm focus:border-emerald-500/50 transition-all outline-none"
                                    placeholder="https://..."
                                />
                                <p className="text-slate-600 text-[10px] mt-2 px-1 italic">*Este link é o que será enviado no WhatsApp automaticamente após a compra.</p>
                            </div>
                        </div>
                    </section>

                    {/* Grupos de WhatsApp */}
                    <section className="glass-card p-8 rounded-3xl border border-white/5 bg-slate-900/40">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                                <Users className="text-cyan-500 w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold uppercase tracking-tight">Grupos de WhatsApp</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-cyan-500 uppercase tracking-widest mb-4">Grupo de Clientes (Pós-Venda)</h3>
                                <div>
                                    <label htmlFor="customerGroupName" className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Nome do Grupo</label>
                                    <input
                                        id="customerGroupName"
                                        type="text"
                                        value={settings.customerGroupName}
                                        onChange={(e) => setSettings({ ...settings, customerGroupName: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500/50 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="customerGroupUrl" className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Link (Convite)</label>
                                    <input
                                        id="customerGroupUrl"
                                        type="text"
                                        value={settings.customerGroupUrl}
                                        onChange={(e) => setSettings({ ...settings, customerGroupUrl: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-cyan-400 font-mono text-xs focus:border-cyan-500/50 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-4">Comunidade (Possíveis Clientes)</h3>
                                <div>
                                    <label htmlFor="communityGroupName" className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Nome da Comunidade</label>
                                    <input
                                        id="communityGroupName"
                                        type="text"
                                        value={settings.communityGroupName}
                                        onChange={(e) => setSettings({ ...settings, communityGroupName: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-500/50 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="communityGroupUrl" className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Link (Convite)</label>
                                    <input
                                        id="communityGroupUrl"
                                        type="text"
                                        value={settings.communityGroupUrl}
                                        onChange={(e) => setSettings({ ...settings, communityGroupUrl: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-yellow-400 font-mono text-xs focus:border-yellow-500/50 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <footer className="flex items-center justify-between pt-8">
                        <div className="flex items-center gap-2">
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 text-emerald-500 font-bold text-sm"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    {message}
                                </motion.div>
                            )}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-cyan-500 transition-all shadow-[8px_8px_0px_rgba(255,255,255,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Salvar Alterações
                        </button>
                    </footer>
                </div>
            </div>
        </main>
    );
}
