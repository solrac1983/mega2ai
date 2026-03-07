"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, ShieldCheck, Loader2, Copy, Check, QrCode } from "lucide-react";

declare global {
    interface Window {
        MercadoPago: any;
    }
}

interface Props {
    planId: string;
    planName: string;
    price: string;
    clientInfo: {
        name: string;
        email: string;
        whatsapp: string;
    };
    onSuccess: () => void;
    onError: (error: any) => void;
}

export default function TransparentCheckout({ planId, planName, price, clientInfo, onSuccess, onError }: Props) {
    const [status, setStatus] = useState<"loading" | "ready" | "error" | "extension" | "pix_success">("loading");
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const hasBeenInitialized = useRef(false);
    const retryCount = useRef(0);

    const initMP = useCallback(async () => {
        if (!window.MercadoPago || hasBeenInitialized.current) return;

        const container = document.getElementById('paymentBrick_container');
        if (!container) return;

        hasBeenInitialized.current = true;

        const PUBLIC_KEY = "APP_USR-5d74603f-efaf-4ad2-b926-8306e48963bd";

        try {
            const mp = new window.MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
            const bricksBuilder = mp.bricks();

            const settings = {
                initialization: {
                    amount: Number(price.replace(',', '.')),
                    payer: { email: clientInfo.email },
                },
                customization: {
                    visual: {
                        style: {
                            theme: 'dark',
                            customVariables: {
                                borderRadius: '12px',
                                colorPrimary: '#22d3ee',
                                colorBackground: '#020617',
                            }
                        }
                    },
                    paymentMethods: {
                        maxInstallments: 12,
                        ticket: ["all"],
                        bankTransfer: ["all"]
                    }
                },
                callbacks: {
                    onReady: () => setStatus("ready"),
                    onSubmit: async (formData: any) => {
                        try {
                            const res = await fetch("/api/payments/process", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    formData,
                                    planId,
                                    planName,
                                    price,
                                    clientInfo
                                })
                            });

                            const result = await res.json();
                            if (!res.ok) throw new Error(result.details || "Erro no processamento");

                            // Se for Pix, mostramos o código na tela
                            if (formData.payment_method_id === "pix" && result.qr_code) {
                                setPixData({
                                    qr_code: result.qr_code,
                                    qr_code_base64: result.qr_code_base64
                                });
                                setStatus("pix_success");
                            } else if (result.status === "approved" || result.status === "pending") {
                                onSuccess();
                            } else {
                                onError(result);
                            }
                        } catch (err: any) {
                            onError(err);
                        }
                    },
                    onError: (error: any) => {
                        console.error("❌ Erro MP:", error);
                        const errS = JSON.stringify(error).toLowerCase();
                        if (errS.includes("site_id") || errS.includes("404") || errS.includes("public_key")) {
                            setStatus("extension");
                        } else {
                            setStatus("error");
                            setErrorMsg("Houve um erro técnico. Tente recarregar.");
                        }
                        onError(error);
                    }
                }
            };

            await bricksBuilder.create('payment', 'paymentBrick_container', settings);
        } catch (err: any) {
            hasBeenInitialized.current = false;
            setStatus("error");
        }
    }, [clientInfo, planId, planName, price, onError, onSuccess]);

    useEffect(() => {
        let isMounted = true;
        const handleError = (e: any) => {
            const msg = (e.reason?.message || e.message || "").toLowerCase();
            if (msg.includes("site id") || msg.includes("site_id") || msg.includes("mercadopago")) {
                if (isMounted) setStatus("extension");
            }
        };
        window.addEventListener('unhandledrejection', handleError);
        window.addEventListener('error', handleError);

        const timeout = setTimeout(() => {
            if (isMounted && status === "loading") {
                setStatus("error");
                setErrorMsg("O carregamento travou devido a instabilidade ou extensões.");
            }
        }, 8000);

        const checkMP = setInterval(() => {
            if (!isMounted) return;
            if (window.MercadoPago && !hasBeenInitialized.current) {
                initMP();
            } else if (!window.MercadoPago) {
                retryCount.current++;
                if (retryCount.current > 10) {
                    setStatus("error");
                    setErrorMsg("Scripts de segurança não carregados.");
                }
            }
        }, 1000);

        return () => {
            isMounted = false;
            window.removeEventListener('unhandledrejection', handleError);
            window.removeEventListener('error', handleError);
            clearInterval(checkMP);
            clearTimeout(timeout);
        };
    }, [initMP, status]);

    const copyPixCode = () => {
        if (pixData?.qr_code) {
            navigator.clipboard.writeText(pixData.qr_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="w-full relative min-h-[480px] flex flex-col items-center justify-center py-4">

            <AnimatePresence mode="wait">
                {status === "loading" && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-6" />
                        <h3 className="text-white font-black text-xl mb-2 tracking-tighter uppercase">Sincronizando</h3>
                    </motion.div>
                )}

                {status === "pix_success" && pixData && (
                    <motion.div
                        key="pix_success"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center w-full max-w-sm px-4"
                    >
                        <div className="w-16 h-16 bg-emerald-500/10 flex items-center justify-center rounded-full mb-6">
                            <Check className="text-emerald-500 w-8 h-8" />
                        </div>
                        <h3 className="text-white font-black text-2xl mb-2 uppercase tracking-tighter">Pix Gerado!</h3>
                        <p className="text-slate-400 text-sm mb-8">Escaneie o QR Code ou copie o código abaixo para pagar.</p>

                        <div className="bg-white p-4 rounded-3xl mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            <img
                                src={`data:image/jpeg;base64,${pixData.qr_code_base64}`}
                                alt="QR Code Pix"
                                className="w-48 h-48 block"
                            />
                        </div>

                        <div className="w-full space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-cyan-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative bg-slate-900 border border-white/5 p-4 rounded-xl flex flex-col gap-2 overflow-hidden">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-left">Código Pix (Copia e Cola)</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[11px] text-white font-mono truncate text-left">{pixData.qr_code}</p>
                                        </div>
                                        <button
                                            onClick={copyPixCode}
                                            className="flex-shrink-0 bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {copied && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Código copiado com sucesso!</motion.p>
                            )}
                        </div>

                        <div className="mt-10 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl w-full">
                            <p className="text-[10px] text-cyan-400 font-bold uppercase leading-relaxed">
                                🔔 Após o pagamento seu plano será ativado automaticamente. Pode fechar esta janela se preferir.
                            </p>
                        </div>
                    </motion.div>
                )}

                {status === "extension" && (
                    <motion.div key="extension" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center p-8 bg-red-950/20 border border-red-500/20 rounded-[2rem]">
                        <AlertTriangle className="text-red-500 w-16 h-16 mb-6" />
                        <h3 className="text-white font-black text-2xl mb-4 uppercase tracking-tighter">Bloqueio Ativo</h3>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">Use uma <b>Janela Anônima</b> para finalizar o pagamento de forma segura.</p>
                        <button onClick={() => window.location.reload()} className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase hover:bg-cyan-400 transition-all">RECARREGAR</button>
                    </motion.div>
                )}

                {status === "error" && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center p-10">
                        <AlertTriangle className="text-yellow-500 w-12 h-12 mb-6" />
                        <h3 className="text-white font-black text-lg mb-2 uppercase tracking-tighter">Erro de Carregamento</h3>
                        <p className="text-slate-500 text-xs mb-10">{errorMsg}</p>
                        <button onClick={() => window.location.reload()} className="bg-white text-black px-8 py-4 font-black text-[10px] uppercase hover:bg-cyan-400 transition-all rounded-xl">Recarregar</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                id="paymentBrick_container"
                className={`w-full transition-all duration-1000 ${status === "ready" ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 overflow-hidden pointer-events-none'}`}
            />
        </div>
    );
}
