"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, QrCode } from "lucide-react";

interface Props {
    planId: string;
    planName: string;
    price: string;
    clientInfo: {
        name: string;
        email: string;
        whatsapp: string;
        document: string;
    };
    onSuccess: () => void;
}

export default function TransparentCheckout({ planId, planName, price, clientInfo, onSuccess }: Props) {
    const [copied, setCopied] = useState(false);

    // Salva o cliente no banco apenas como "PENDING" assim que a tela abre, para termos os dados
    useEffect(() => {
        fetch("/api/payments/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId, planName, price, clientInfo })
        }).catch(err => console.error("Erro ao registrar pedido pendente:", err));
    }, [planId, planName, price, clientInfo]);

    return (
        <div className="w-full relative min-h-[400px] flex flex-col items-center justify-center py-2">

            <AnimatePresence mode="wait">
                <motion.div
                    key="pix_ready"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center w-full"
                >
                    <div className="w-14 h-14 bg-emerald-500/10 flex items-center justify-center rounded-full mb-4">
                        <QrCode className="text-emerald-500 w-7 h-7" />
                    </div>
                    <h3 className="text-white font-black text-xl mb-1 uppercase tracking-tighter">Pague via Pix</h3>
                    <p className="text-slate-400 text-xs mb-6 px-4">Copie a chave Pix abaixo e pague no seu banco.</p>

                    <div className="w-full space-y-4 px-4">
                        <div className="bg-slate-900 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left">Chave Pix (CNPJ)</p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg text-white font-mono font-bold truncate text-left flex-1 select-all">47.360.069/0001-90</p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText("47.360.069/0001-90");
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="bg-cyan-500/10 hover:bg-cyan-500/20 p-3 rounded-lg transition-colors border border-cyan-500/20 flex items-center gap-2"
                                >
                                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-cyan-400" />}
                                    <span className="text-[10px] font-bold text-cyan-400 uppercase">{copied ? "COPIADO!" : "COPIAR"}</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left">Valor a Pagar</p>
                            <p className="text-2xl text-cyan-400 font-black text-left">R$ {price}</p>
                        </div>
                    </div>

                    <div className="w-full px-4 mt-8">
                        <button
                            onClick={() => {
                                // Envia os dados do cliente para salvar o pedido como pendente, se desejar, ou apenas avança
                                onSuccess();
                            }}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Já realizei o pagamento
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl mx-4">
                        <p className="text-[9px] text-orange-400 font-bold uppercase leading-relaxed text-center">
                            Atenção: A liberação ocorrerá assim que nosso sistema identificar o pagamento neste CNPJ.
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
