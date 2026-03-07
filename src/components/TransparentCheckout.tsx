"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, ShieldCheck, Loader2, ArrowRight } from "lucide-react";

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
    const [status, setStatus] = useState<"loading" | "ready" | "error" | "extension">("loading");
    const [errorMsg, setErrorMsg] = useState<string>("");
    const hasBeenInitialized = useRef(false);
    const retryCount = useRef(0);

    const initMP = useCallback(async () => {
        if (!window.MercadoPago || hasBeenInitialized.current) return;

        const container = document.getElementById('paymentBrick_container');
        if (!container) return;

        hasBeenInitialized.current = true;

        // CHAVE DE PRODUÇÃO REAL FORÇADA
        const PUBLIC_KEY = "APP_USR-5d74603f-efaf-4ad2-b926-8306e48963bd";

        console.log("-----------------------------------------");
        console.log("🚀 INICIANDO CANAL DE PAGAMENTO");
        console.log("📦 PLANO:", planName);
        console.log("-----------------------------------------");

        try {
            const mp = new window.MercadoPago(PUBLIC_KEY, {
                locale: 'pt-BR'
            });

            const bricksBuilder = mp.bricks();

            const settings = {
                initialization: {
                    amount: Number(price.replace(',', '.')),
                    payer: {
                        email: clientInfo.email,
                    },
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
                    onReady: () => {
                        console.log("✅ Sistema Pronto.");
                        setStatus("ready");
                    },
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

                            if (result.status === "approved" || result.status === "pending") {
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
            console.error("❌ Falha crítica:", err);
            hasBeenInitialized.current = false;
            setStatus("error");
        }
    }, [clientInfo, planId, planName, price, onError, onSuccess]);

    useEffect(() => {
        let isMounted = true;

        // Listener para erros silenciosos do Mercado Pago
        const handleError = (e: any) => {
            const msg = (e.reason?.message || e.message || "").toLowerCase();
            if (msg.includes("site id") || msg.includes("site_id") || msg.includes("mercadopago")) {
                console.warn("⚠️ Detectada falha silenciosa de extensão.");
                if (isMounted) setStatus("extension");
            }
        };

        window.addEventListener('unhandledrejection', handleError);
        window.addEventListener('error', handleError);

        // Timeout Agressivo: 7 segundos
        const timeout = setTimeout(() => {
            if (isMounted && status === "loading") {
                setStatus("error");
                setErrorMsg("O carregamento travou. Isso geralmente ocorre devido a extensões de bloqueio.");
            }
        }, 7000);

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

    const forceReload = () => {
        window.location.reload();
    };

    return (
        <div className="w-full relative min-h-[480px] flex flex-col items-center justify-center py-8">

            <AnimatePresence mode="wait">
                {status === "loading" && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center"
                    >
                        <div className="relative mb-8">
                            <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
                            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
                        </div>
                        <h3 className="text-white font-black text-xl mb-2 tracking-tighter uppercase">Sincronizando Banco</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
                            Criptografando Canal Seguro...
                        </p>
                    </motion.div>
                )}

                {status === "extension" && (
                    <motion.div
                        key="extension"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center p-8 bg-red-950/20 border border-red-500/20 rounded-[2rem]"
                    >
                        <AlertTriangle className="text-red-500 w-16 h-16 mb-6" />
                        <h3 className="text-white font-black text-2xl mb-4 tracking-tighter uppercase">Bloqueio Ativo</h3>
                        <p className="text-slate-400 text-sm mb-8 max-w-[300px]">
                            O seu navegador impediu a conexão segura forçando chaves de teste.
                        </p>

                        <div className="bg-white/5 p-6 rounded-2xl w-full text-left border border-white/5 mb-8">
                            <p className="text-cyan-400 text-[10px] font-black uppercase mb-3 tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3" /> Solução Obrigatória
                            </p>
                            <p className="text-xs text-white/80 leading-relaxed font-medium">
                                Abra esta página em uma <span className="text-white font-bold underline">Janela Anônima</span> (Ctrl+Shift+N) para finalizar o pagamento.
                            </p>
                        </div>

                        <button
                            onClick={forceReload}
                            className="group flex items-center justify-center gap-3 w-full bg-white text-black py-5 rounded-xl font-black text-xs uppercase hover:bg-cyan-400 transition-all shadow-xl"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                            RECARREGAR PÁGINA
                        </button>
                    </motion.div>
                )}

                {status === "error" && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center p-10"
                    >
                        <AlertTriangle className="text-yellow-500 w-12 h-12 mb-6" />
                        <h3 className="text-white font-black text-lg mb-2 tracking-tighter uppercase">Erro no Carregamento</h3>
                        <p className="text-slate-500 text-xs mb-10 max-w-[250px]">{errorMsg}</p>

                        <div className="grid grid-cols-1 gap-3 w-full">
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-white text-black px-8 py-4 font-black text-[10px] uppercase hover:bg-cyan-400 transition-all rounded-xl"
                            >
                                Recarregar Página
                            </button>
                            <button
                                onClick={() => setStatus("extension")}
                                className="text-slate-500 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors mt-4"
                            >
                                Tenho extensões ativas?
                            </button>
                        </div>
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
