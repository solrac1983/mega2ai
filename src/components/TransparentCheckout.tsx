"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Copy, AlertTriangle, ExternalLink, QrCode } from "lucide-react";

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
    onError: (error: any) => void;
}

export default function TransparentCheckout({ planId, planName, price, clientInfo, onSuccess, onError }: Props) {
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
            console.error("❌ Erro PicPay:", err);
            setStatus("error");
            setErrorMsg(err.message || "Falha ao gerar pagamento.");
            onError(err);
        }
    }, [clientInfo, planId, planName, price, onError]);

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
        <div className="w-full relative min-h-[400px] flex flex-col items-center justify-center py-2">

            <AnimatePresence mode="wait">
                {status === "loading" && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
                        <h3 className="text-white font-black text-lg mb-1 tracking-tighter uppercase text-center">Gerando seu Pix...</h3>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest text-center">Conectando ao PicPay</p>
                    </motion.div>
                )}

                {status === "pix_ready" && pixData && (
                    <motion.div
                        key="pix_ready"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center w-full"
                    >
                        <div className="w-14 h-14 bg-emerald-500/10 flex items-center justify-center rounded-full mb-4">
                            <QrCode className="text-emerald-500 w-7 h-7" />
                        </div>
                        <h3 className="text-white font-black text-xl mb-1 uppercase tracking-tighter">Tudo pronto!</h3>
                        <p className="text-slate-400 text-xs mb-6 px-4">Escaneie o QR Code ou use o código abaixo.</p>

                        {pixData.qr_code_base64 ? (
                            <div className="bg-white p-3 rounded-2xl mb-6 shadow-2xl">
                                <img
                                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                                    alt="QR Code Pix"
                                    className="w-44 h-44 block"
                                />
                            </div>
                        ) : (
                            <div className="w-44 h-44 bg-slate-900 border border-white/5 rounded-2xl mb-6 flex items-center justify-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase p-4">QR Code indisponível. Use o copia e cola.</p>
                            </div>
                        )}

                        <div className="w-full space-y-4 px-4">
                            <div className="bg-slate-900 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left">Código Copia e Cola</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-[11px] text-white font-mono truncate text-left flex-1 select-all">{pixData.qr_code}</p>
                                    <button
                                        onClick={copyPixCode}
                                        className="bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors border border-white/5"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                    </button>
                                </div>
                            </div>

                            {pixData.payment_url && (
                                <a
                                    href={pixData.payment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 text-[10px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-400/20 rounded-xl hover:bg-cyan-400/10 transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Pagar no App PicPay / Cartão
                                </a>
                            )}
                        </div>

                        <div className="mt-8 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl mx-4">
                            <p className="text-[9px] text-cyan-400 font-bold uppercase leading-relaxed text-center">
                                Ativação automática após o pagamento. <br />
                                O código expira em 1 hora.
                            </p>
                        </div>
                    </motion.div>
                )}

                {status === "error" && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center p-8">
                        <AlertTriangle className="text-red-500 w-12 h-12 mb-4" />
                        <h3 className="text-white font-black text-lg mb-2 tracking-tighter uppercase">Erro ao gerar pagamento</h3>
                        <p className="text-slate-500 text-xs mb-8 leading-relaxed">{errorMsg}</p>
                        <button
                            onClick={() => {
                                hasCalledAPI.current = false;
                                setStatus("loading");
                                generatePayment();
                            }}
                            className="bg-white text-black px-8 py-4 font-black text-[10px] uppercase hover:bg-cyan-400 transition-all rounded-xl shadow-lg w-full"
                        >
                            Tentar Novamente
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
