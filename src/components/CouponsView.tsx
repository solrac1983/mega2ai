"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash, Plus, RefreshCw, Loader2 } from "lucide-react";

interface Coupon {
    id: string;
    code: string;
    discountValue: number;
    isPercentage: boolean;
    expiresAt: string | null;
    active: boolean;
    usedCount: number;
    createdAt: string;
}

export default function CouponsView() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New coupon form state
    const [code, setCode] = useState("");
    const [discountValue, setDiscountValue] = useState("");
    const [isPercentage, setIsPercentage] = useState(true);
    const [expiresDays, setExpiresDays] = useState("");

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/coupons");
            const data = await res.json();
            if (Array.isArray(data)) setCoupons(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/admin/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, discountValue, isPercentage, expiresDays })
            });
            if (res.ok) {
                setCode("");
                setDiscountValue("");
                setExpiresDays("");
                fetchCoupons();
            } else {
                const data = await res.json();
                alert(data.error || "Erro ao criar cupom.");
            }
        } catch (error) {
            alert("Erro na conexão");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir o cupom?")) return;
        try {
            await fetch("/api/admin/coupons", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            fetchCoupons();
        } catch (error) {
            alert("Erro ao remover");
        }
    };

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 rounded-3xl border border-white/5">
                <div className="mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Plus className="text-cyan-500 w-5 h-5" />
                        Criar Novo Cupom
                    </h2>
                    <p className="text-slate-400 text-xs">Descontos dinâmicos para aplicar no Mercado Pago.</p>
                </div>

                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Código Promocional</label>
                        <input
                            required
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Ex: MEGA20"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none uppercase font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Valor do Desconto</label>
                        <input
                            required
                            type="number"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder="Ex: 20"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tipo de Desconto</label>
                        <select
                            value={isPercentage ? "true" : "false"}
                            onChange={(e) => setIsPercentage(e.target.value === "true")}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
                        >
                            <option value="true">Porcentagem (%)</option>
                            <option value="false">Valor Fixo (R$)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Vencimento (Dias)</label>
                        <input
                            type="number"
                            value={expiresDays}
                            onChange={(e) => setExpiresDays(e.target.value)}
                            placeholder="Opcional. Ex: 7"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-cyan-500 text-slate-950 font-black uppercase tracking-widest text-xs py-3 px-4 rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50 h-[46px] w-full flex items-center justify-center"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar Cupom"}
                    </button>
                </form>
            </div>

            <div className="glass-card rounded-3xl border border-white/5 bg-slate-900/40 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <h2 className="text-xl font-bold">Cupons Ativos</h2>
                    <button onClick={fetchCoupons} className="hover:text-cyan-400 transition-colors">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-black/40 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                <th className="px-8 py-4">Cupom</th>
                                <th className="px-8 py-4">Desconto</th>
                                <th className="px-8 py-4">Status / Validade</th>
                                <th className="px-8 py-4">Uso</th>
                                <th className="px-8 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-10 text-center text-slate-500 text-sm">Nenhum cupom gerado.</td>
                                </tr>
                            ) : coupons.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-4 text-white font-mono font-bold">{coupon.code}</td>
                                    <td className="px-8 py-4 text-cyan-400 font-bold">
                                        {coupon.isPercentage ? `${coupon.discountValue}%` : `R$ ${coupon.discountValue.toFixed(2)}`}
                                    </td>
                                    <td className="px-8 py-4">
                                        {coupon.expiresAt && new Date(coupon.expiresAt) < new Date() ? (
                                            <span className="text-red-500 text-xs font-bold bg-red-500/10 px-2 py-1 rounded">EXPIRADO</span>
                                        ) : (
                                            <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">
                                                {coupon.expiresAt ? `ATÉ ${new Date(coupon.expiresAt).toLocaleDateString()}` : 'SEMPRE ATIVO'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-4 text-slate-400 text-sm">{coupon.usedCount}x</td>
                                    <td className="px-8 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(coupon.id)}
                                            className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                            title="Excluir Cupom"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
