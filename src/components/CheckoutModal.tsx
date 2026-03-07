"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import TransparentCheckout from "./TransparentCheckout";

const schema = z.object({
    name: z.string().min(3, "Nome muito curto"),
    email: z.string().email("Email inválido"),
    whatsapp: z.string().min(10, "WhatsApp inválido (DDD+Número)"),
    document: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
});

type FormData = z.infer<typeof schema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    planId: string;
    planName: string;
    price: string;
}

export default function CheckoutModal({ isOpen, onClose, planId, planName, price }: Props) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"info" | "payment" | "success">("info");
    const [clientData, setClientData] = useState<FormData | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, "")
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2")
            .replace(/(-\d{4})(\d+?)$/, "$1");
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskPhone(e.target.value);
        setValue("whatsapp", masked, { shouldValidate: true });
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            // Se for grátis, segue o fluxo antigo pelo checkout/route.ts
            if (Number(price.replace(",", ".")) === 0) {
                const response = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...data,
                        planId,
                        planName,
                        price,
                    }),
                });

                const result = await response.json();

                if (result.free) {
                    window.location.href = "/obrigado?plan=free";
                    return;
                }
            }

            // Para planos pagos, salvamos o cliente e avançamos para o pagamento transparente
            setClientData(data);
            setStep("payment");

        } catch (error) {
            console.error("Checkout Error:", error);
            alert("Ocorreu um erro ao processar seu pedido. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass-card w-full max-w-md p-8 rounded-3xl relative z-10"
                    >
                        <button
                            onClick={onClose}
                            aria-label="Fechar"
                            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-3xl font-bold mb-2">
                            {step === "info" ? "Quase lá!" : "Pagamento"}
                        </h2>
                        <p className="text-slate-400 mb-8">
                            {step === "info"
                                ? <>Você está adquirindo o plano <span className="text-cyan-400 font-bold">{planName}</span> por <span className="text-white font-bold">R$ {price}</span>.</>
                                : <>Conclua o pagamento para ativar sua licença.</>
                            }
                        </p>

                        {step === "info" ? (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                                    <input
                                        {...register("name")}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-sans"
                                        placeholder="Ex: João Silva"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">E-mail</label>
                                    <input
                                        {...register("email")}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-sans"
                                        placeholder="seu@email.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">WhatsApp (com DDD)</label>
                                    <input
                                        {...register("whatsapp")}
                                        onChange={handlePhoneChange}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono"
                                        placeholder="(00) 00000-0000"
                                    />
                                    {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">CPF (apenas números)</label>
                                    <input
                                        {...register("document")}
                                        maxLength={14}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono"
                                        placeholder="000.000.000-00"
                                    />
                                    {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document.message}</p>}
                                </div>

                                <div className="pt-4">
                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full bg-cyan-500 text-slate-950 py-4 rounded-xl font-bold text-lg hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            "PROSSEGUIR PARA PAGAMENTO"
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="w-full h-full max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                <TransparentCheckout
                                    planId={planId}
                                    planName={planName}
                                    price={price}
                                    clientInfo={clientData!}
                                    onSuccess={() => {
                                        setStep("success");
                                        setTimeout(() => {
                                            window.location.href = "/obrigado?plan=paid";
                                        }, 1500);
                                    }}
                                    onError={(err) => {
                                        alert("Falha no pagamento: " + (err.details || "Verifique seus dados."));
                                    }}
                                />
                                <button
                                    onClick={() => setStep("info")}
                                    className="w-full text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-6 hover:text-white transition-colors"
                                >
                                    &larr; Voltar para Detalhes
                                </button>
                            </div>
                        )}

                        <p className="text-center text-slate-500 text-xs mt-6 px-4">
                            Ao prosseguir, você concorda com nossos termos e política de privacidade.
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
