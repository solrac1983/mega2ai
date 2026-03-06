"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";

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
    const [loading, setLoading] = useState(true);
    const brickContainerRef = useRef<HTMLDivElement>(null);
    const mpInstanceRef = useRef<any>(null);

    const initMP = () => {
        if (!window.MercadoPago) return;

        // Configura o Mercado Pago
        const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || 'TEST-APP-KEY', {
            locale: 'pt-BR'
        });
        mpInstanceRef.current = mp;

        const bricksBuilder = mp.bricks();

        const renderPaymentBrick = async (builder: any) => {
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
                            theme: 'dark', // Estilo escuro para combinar com o site
                        }
                    },
                    paymentMethods: {
                        maxInstallments: 12,
                        types: {
                            excluded: ['ticket'] // Opcionalmente remover boleto se o usuário preferir pix/cartão
                        }
                    }
                },
                callbacks: {
                    onReady: () => {
                        setLoading(false);
                        console.log("Brick Ready");
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

                            if (result.status === "approved") {
                                onSuccess();
                            } else {
                                onError(result);
                            }
                        } catch (err) {
                            console.error("Payment Submission Error:", err);
                            onError(err);
                        }
                    },
                    onError: (error: any) => {
                        console.error("Brick Error:", error);
                        onError(error);
                    }
                }
            };

            if (brickContainerRef.current) {
                brickContainerRef.current.innerHTML = ''; // Clear previous
                await builder.create('payment', 'paymentBrick_container', settings);
            }
        };

        renderPaymentBrick(bricksBuilder);
    };

    useEffect(() => {
        if (window.MercadoPago) {
            initMP();
        }
    }, []);

    return (
        <div className="w-full">
            <Script
                src="https://sdk.mercadopago.com/js/v2"
                onLoad={initMP}
                strategy="afterInteractive"
            />

            {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Iniciando Checkout Seguro...</p>
                </div>
            )}

            <div id="paymentBrick_container" ref={brickContainerRef} className="w-full min-h-[400px]" />
        </div>
    );
}
