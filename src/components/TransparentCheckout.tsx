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
    const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; payment_url: string; qr_code_url?: string } | null>(null);
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
                payment_url: result.payment_url || "",
                qr_code_url: result.qr_code_url
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
        <div className="w-full relative flex flex-col items-center justify-center py-2 bg-[#0B0E14] rounded-xl border border-white/5">
            {/* Cabecalho Leigos Academy */}
            <div className="flex flex-col items-center mb-4 w-full">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-white font-bold text-lg">MEGA 2AI</span>
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
                        <p className="text-pink-500 font-black text-lg mb-2 text-center">R$ {price}</p>
                        <p className="text-[#646A83] text-[10px] mb-4 text-center">Abra o app do seu banco e escaneie o código</p>

                        {/* QRCode Area */}
                        {(pixData.qr_code_url || pixData.qr_code_base64) ? (
                            <div className="bg-white p-2 rounded-xl mb-4 shadow-inner flex items-center justify-center">
                                <img
                                    src={pixData.qr_code_url || `data:image/png;base64,${pixData.qr_code_base64}`}
                                    alt="QR Code Pix"
                                    className="w-32 h-32 block"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full max-h-[85vh] overflow-y-auto custom-scrollbar pr-2">
                                <div className="w-32 h-32 bg-[#0B0E14] border border-white/5 rounded-xl mb-4 flex items-center justify-center">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase p-2 text-center">QR Code indisponível.</p>
                                </div>
                            </div>
                        )}

                        <div className="w-full space-y-1">
                            <p className="text-[10px] text-[#646A83] text-left">Ou copie o código PIX</p>
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

                        <div className="w-full space-y-2 mt-4">
                            {/* Botão Enviar Comprovante */}
                            <a
                                href={`https://wa.me/5584996706253?text=${encodeURIComponent(`Olá, segue o comprovante do pagamento de R$ ${price} referente ao plano ${planName}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-4 bg-[#00C2FF] hover:bg-[#00A3D9] text-black font-black text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,194,255,0.3)]"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Enviar Comprovante
                            </a>

                            {/* Botão Tirar Dúvidas */}
                            <a
                                href={`https://wa.me/5584996706253?text=${encodeURIComponent(`Olá, tenho uma dúvida sobre o plano ${planName}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-transparent hover:bg-white/5 text-white font-bold text-xs uppercase tracking-widest rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Tirar dúvidas no WhatsApp
                            </a>
                        </div>

                        {/* Status animado */}
                        <div className="mt-8 flex items-center gap-2">
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
