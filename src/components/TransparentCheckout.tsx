"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, ShieldCheck, Loader2, Copy, Check, QrCode, CreditCard } from "lucide-react";

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
                    payer: {
                        email: clientInfo.email,
                        firstName: clientInfo.name.split(" ")[0],
                        lastName: clientInfo.name.split(" ").slice(1).join(" ") || "Cliente"
                    },
                },
                customization: {
                    visual: {
                        style: {
                            theme: 'dark', // Usando tema dark padrão para evitar avisos de propriedades inválidas
                        }
                    },
                    paymentMethods: {
                        maxInstallments: 12,
                        bankTransfer: ["all"], // Inclui Pix
                        creditCard: "all",
                        debitCard: "all",
                        // Removido ticket (Boleto)
                    }
                },
                callbacks: {
                    onReady: () => {
                        console.log("✅ Checkout Pronto.");
                        setStatus("ready");
                    },
                    onSubmit: async (formData: any) => {
                        console.log("📤 Processando pagamento:", formData.payment_method_id);
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
                            console.error("❌ Erro Submit:", err);
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
                            setErrorMsg("Falha técnica no carregamento. Tente novamente.");
                        }
                        onError(error);
                    }
                }
            };

            await bricksBuilder.create('payment', 'paymentBrick_container', settings);
        } catch (err: any) {
            console.error("❌ Crash MP:", err);
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
                setErrorMsg("Tempo esgotado. Verifique sua conexão ou extensões.");
            }
        }, 10000);

        const checkMP = setInterval(() => {
            if (!isMounted) return;
            if (window.MercadoPago && !hasBeenInitialized.current) {
                initMP();
            } else if (!window.MercadoPago) {
                retryCount.current++;
                if (retryCount.current > 15) {
                    setStatus("error");
                    setErrorMsg("Scripts de segurança bloqueados.");
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
        <div className="w-full relative min-h-[500px] flex flex-col items-center justify-center py-2">

            <AnimatePresence mode="wait">
                {status === "loading" && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
                        <h3 className="text-white font-black text-lg mb-1 tracking-tighter uppercase">Conectando...</h3>
                    </motion.div>
                )}

                {status === "pix_success" && pixData && (
                    <motion.div
                        key="pix_success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center w-full max-w-sm"
                    >
                        <div className="w-14 h-14 bg-emerald-500/10 flex items-center justify-center rounded-full mb-4">
                            <Check className="text-emerald-500 w-7 h-7" />
                        </div>
                        <h3 className="text-white font-black text-xl mb-1 uppercase tracking-tighter">Pix Pronto</h3>
                        <p className="text-slate-400 text-xs mb-6 px-4">Pague pelo QR Code ou copie o código abaixo.</p>

                        <div className="bg-white p-3 rounded-2xl mb-6 shadow-2xl">
                            <img
                                src={`data:image/jpeg;base64,${pixData.qr_code_base64}`}
                                alt="QR Code Pix"
                                className="w-40 h-40 block"
                            />
                        </div>

                        <div className="w-full space-y-4 px-4">
                            <div className="bg-slate-900 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left">Código Copia e Cola</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-[11px] text-white font-mono truncate text-left flex-1">{pixData.qr_code}</p>
                                    <button
                                        onClick={copyPixCode}
                                        className="bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors border border-white/5"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                    </button>
                                </div>
                            </div>

                            {copied && (
                                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest text-center">Copiado!</p>
                            )}
                        </div>

                        <div className="mt-8 mx-4 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                            <p className="text-[9px] text-cyan-400 font-bold uppercase leading-relaxed text-center">
                                Seu plano será ativado após o pagamento. Não é necessário enviar o comprovante.
                            </p>
                        </div>
                    </motion.div>
                )}

                {status === "extension" && (
                    <motion.div key="extension" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center p-8 bg-red-950/20 border border-red-500/20 rounded-[2rem]">
                        <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
                        <h3 className="text-white font-black text-xl mb-4 tracking-tighter uppercase">Conflito Detectado</h3>
                        <p className="text-slate-400 text-sm mb-6">Uma extensão do seu navegador está bloqueando o pagamento. Use uma <b>Janela Anônima</b> para continuar.</p>
                        <button onClick={() => window.location.reload()} className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase hover:bg-cyan-400 transition-all shadow-lg">RECARREGAR</button>
                    </motion.div>
                )}

                {status === "error" && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center p-8">
                        <AlertTriangle className="text-yellow-500 w-10 h-10 mb-4" />
                        <h3 className="text-white font-black text-lg mb-2 tracking-tighter uppercase">Não foi possível carregar</h3>
                        <p className="text-slate-500 text-xs mb-8">{errorMsg}</p>
                        <button onClick={() => window.location.reload()} className="bg-white/10 text-white px-8 py-4 font-black text-[10px] uppercase hover:bg-white/20 transition-all rounded-xl border border-white/5">Tentar de novo</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                id="paymentBrick_container"
                className={`w-full transition-all duration-1000 ${status === "ready" ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}
            />
        </div>
    );
}
