"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Copy, AlertTriangle, ShieldCheck } from "lucide-react";

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
    const [status, setStatus] = useState<"loading" | "pix_ready" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; payment_url: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const hasCalledAPI = useRef(false);

    const generatePayment = useCallback(async () => {
        if (hasCalledAPI.current) return;
        hasCalledAPI.current = true;

        try {
            const res = await fetch("/api/payments/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId,
                    planName,
                    price,
                    clientInfo
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.details || result.error || "Erro no processamento");

            setPixData({
                qr_code: result.qr_code || "",
                qr_code_base64: result.qr_code_base64 || "",
                payment_url: result.payment_url || ""
            });
            setStatus("pix_ready");

        } catch (err: any) {
            console.error("❌ Erro ao gerar Pix:", err);
            setStatus("error");
            setErrorMsg(err.message || "Falha ao gerar pagamento.");
        }
    }, [clientInfo, planId, planName, price]);

    useEffect(() => {
        generatePayment();
    }, [generatePayment]);

    const copyPixCode = () => {
        if (pixData?.qr_code) {
            navigator.clipboard.writeText(pixData.qr_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="w-full relative min-h-[400px] flex flex-col items-center justify-center py-4 bg-[#0B0E14] rounded-xl border border-white/5">
            {/* Cabecalho Leigos Academy */}
            <div className="flex flex-col items-center mb-6 w-full">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-white font-bold text-lg">Leigos Academy</span>
                </div>
                <p className="text-[#3b415a] uppercase tracking-widest text-[9px] font-bold">Pagamento Seguro Via Pix</p>
            </div>

            <AnimatePresence mode="wait">
                {status === "loading" && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-10 w-full bg-[#11131A] rounded-2xl border border-white/5 shadow-2xl">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                        <h3 className="text-white font-bold text-sm mb-1 text-center">Gerando seu Pix...</h3>
                        <p className="text-slate-500 text-[10px] text-center">Conectando ao banco central.</p>
                    </motion.div>
                )}

                {status === "pix_ready" && pixData && (
                    <motion.div
                        key="pix_ready"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center w-full bg-[#11131A] rounded-2xl border border-white/5 p-6 shadow-2xl"
                    >
                        <h3 className="text-white font-bold text-base mb-1 text-center">Escaneie o QR Code</h3>
                        <p className="text-[#646A83] text-xs mb-6 text-center">Abra o app do seu banco e escaneie o código</p>

                        {/* QRCode Area */}
                        {pixData.qr_code_base64 ? (
                            <div className="bg-white p-3 rounded-xl mb-6 shadow-inner flex items-center justify-center">
                                <img
                                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                                    alt="QR Code Pix"
                                    className="w-48 h-48 block"
                                />
                            </div>
                        ) : (
                            <div className="w-48 h-48 bg-[#0B0E14] border border-white/5 rounded-xl mb-6 flex items-center justify-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase p-4 text-center">QR Code indisponível.</p>
                            </div>
                        )}

                        <div className="w-full space-y-2">
                            <p className="text-[11px] text-[#646A83] text-left">Ou copie o código PIX</p>
                            <div className="flex items-center gap-2">
                                <div className="bg-[#0B0E14] border border-white/5 text-[#8b91ab] p-3 rounded-lg flex-1 text-[11px] font-mono truncate select-all">
                                    {pixData.qr_code}
                                </div>
                                <button
                                    onClick={copyPixCode}
                                    className="bg-[#1C1F2A] hover:bg-[#252936] p-3 rounded-lg transition-colors border border-white/5 flex items-center justify-center shrink-0"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-[#8b91ab]" />}
                                </button>
                            </div>
                        </div>

                        {/* Status animado */}
                        <div className="mt-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[#646A83] text-[11px]">Aguardando pagamento...</span>
                        </div>

                        {/* Fechar/Novo pagamento */}
                        <button
                            onClick={onSuccess}
                            className="mt-6 text-[#646A83] text-[11px] hover:text-white transition-colors"
                        >
                            ← Novo pagamento
                        </button>
                    </motion.div>
                )}

                {status === "error" && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center p-8 w-full bg-[#11131A] rounded-2xl border border-white/5">
                        <AlertTriangle className="text-red-500 w-10 h-10 mb-4" />
                        <h3 className="text-white font-bold text-sm mb-2">Erro ao gerar pagamento</h3>
                        <p className="text-[#646A83] text-xs mb-8">{errorMsg}</p>
                        <button
                            onClick={() => {
                                hasCalledAPI.current = false;
                                setStatus("loading");
                                generatePayment();
                            }}
                            className="bg-white text-black px-6 py-3 font-bold text-xs hover:bg-[#E5E7EB] transition-all rounded-lg w-full"
                        >
                            Tentar Novamente
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-4 flex items-center gap-1.5 opacity-40">
                <ShieldCheck className="w-3 h-3 text-white" />
                <span className="text-[9px] text-white">Pagamento processado com segurança via PIX</span>
            </div>
        </div>
    );
}
