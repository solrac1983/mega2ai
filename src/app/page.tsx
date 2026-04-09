"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Zap,
  Flame,
  Target,
  Bird,
  ShoppingCart,
  Zap as ZapIcon,
  MessageCircle,
  ArrowRight,
  Globe,
  Cpu,
  Users,
  MousePointer2,
  Heart
} from "lucide-react";
import Link from "next/link";
import CheckoutModal from "@/components/CheckoutModal";

const defaultPlans = [
  {
    id: "free",
    name: "Teste Grátis",
    price: "0,00",
    description: "Teste todo o poder por 5 minutos",
    icon: <Zap className="text-emerald-400 w-10 h-10" />,
    popular: false,
    originalPrice: null,
    type: 'LICENSE' as const
  },
  {
    id: "1day",
    name: "Acesso 24h",
    price: "49,90",
    description: "Ideal para testar ou projetos ultra-rápidos",
    icon: <Zap className="text-yellow-400 w-10 h-10" />,
    popular: false,
    originalPrice: null,
    type: 'LICENSE' as const
  },
  {
    id: "7days",
    name: "Semana Turbo",
    price: "79,90",
    description: "Perfeito para sprints de curto prazo",
    icon: <Flame className="text-orange-500 w-10 h-10" />,
    popular: false,
    originalPrice: null,
    type: 'LICENSE' as const
  },
  {
    id: "30days",
    name: "Expert Mensal",
    price: "159,90",
    description: "O melhor custo-benefício profissional",
    icon: <Target className="text-cyan-400 w-10 h-10" />,
    popular: true,
    originalPrice: null,
    type: 'LICENSE' as const
  },
  {
    id: "lifetime",
    name: "VIP Vitalício",
    price: "Comercial",
    description: "Utilize pra sempre sem mensalidade",
    icon: <Bird className="text-white w-10 h-10" />,
    popular: false,
    originalPrice: null,
    type: 'LICENSE' as const
  },
];

import { Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: [0.23, 1, 0.32, 1]
    },
  },
};

interface StaticPlan {
  id: string;
  name: string;
  price: string | number;
  originalPrice?: string | number | null;
  description: string;
  icon?: React.ReactNode;
  popular?: boolean;
  type?: 'LICENSE' | 'CREDITS';
  credits?: number | null;
}

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<StaticPlan | null>(null);
  const [activePlans, setActivePlans] = useState<StaticPlan[]>(defaultPlans as any);
  const [creditPlans, setCreditPlans] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [links, setLinks] = useState({
    communityUrl: "https://chat.whatsapp.com/exemplo-comunidade",
    whatsappAdmin: "https://wa.me/5584996706253"
  });

  useEffect(() => {
    // Buscar configurações globais
    fetch("/api/public/settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.communityGroupUrl) {
          setLinks({
            communityUrl: data.communityGroupUrl,
            whatsappAdmin: "https://wa.me/5584996706253"
          });
        }
      })
      .catch(err => console.error(err));

    // Buscar planos do banco
    fetch("/api/public/plans")
      .then(res => res.json())
      .then(dbPlans => {
        if (Array.isArray(dbPlans)) {
          // Filtrar Licenças (padrão)
          const mergedPlans = defaultPlans.map(dp => {
            const dbp = dbPlans.find((p: any) => p.id === dp.id);
            if (dbp) {
              return {
                ...dp,
                name: dbp.name,
                price: dbp.price.toFixed(2).replace('.', ','),
                originalPrice: dbp.originalPrice,
                description: dbp.description || dp.description
              };
            }
            return dp;
          });
          setActivePlans(mergedPlans);

          // Filtrar Pacotes de Créditos
          const credits = dbPlans
            .filter((p: any) => p.type === 'CREDITS')
            .sort((a, b) => (a.credits || 0) - (b.credits || 0));
          setCreditPlans(credits);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

  const handleBuy = (plan: StaticPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#020617] relative">
      <div className="fixed inset-0 bg-noise -z-10" />

      {/* Background Gradients */}
      <div className="fixed inset-0 -z-20 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-500/10 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"
        />
      </div>

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="p-8 flex justify-between items-center max-w-[1800px] mx-auto sticky top-0 z-[100] mix-blend-difference"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 180 }}
            className="w-12 h-12 bg-white rounded-none flex items-center justify-center neon-glow"
          >
            <ZapIcon className="text-black" />
          </motion.div>
          <span className="text-3xl font-black tracking-tighter uppercase font-display text-white">mega_2ai <span className="text-cyan-500">v2</span></span>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-8 text-xs font-black uppercase tracking-[0.2em] text-white/50">
            <a href="#funcionalidades" className="hover:text-cyan-400 transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-cyan-400 transition-colors">Preços</a>
            <a href="https://wa.me/5584996706253" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Suporte</a>
          </div>
          <Link href="/admin">
            <button className="text-white border-2 border-white px-8 py-3 font-black text-sm uppercase hover:bg-white hover:text-black transition-all">
              ADMIN
            </button>
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-8 relative overflow-hidden">
        <div className="max-w-[1800px] mx-auto w-full pt-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start gap-4 mb-20"
          >
            <motion.span
              variants={itemVariants}
              className="bg-cyan-500 text-black px-4 py-1 font-black text-xs uppercase tracking-[0.3em]"
            >
              Versão 2.0 Alpha
            </motion.span>
            <h1 className="text-massive font-black tracking-tighter leading-[0.75] flex flex-col">
              <motion.span variants={itemVariants}>ULTRA</motion.span>
              <motion.span variants={itemVariants} className="text-outline">AUTOMATED</motion.span>
              <motion.span variants={itemVariants} className="text-gradient">LOVABLE</motion.span>
            </h1>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end"
          >
            <motion.div variants={itemVariants} className="md:col-span-4 max-w-sm">
              <p className="text-slate-400 font-medium leading-relaxed mb-8 border-l-4 border-cyan-500 pl-6 italic uppercase text-sm">
                A extensão definitiva que quebra os limites do Lovable. Gere códigos ultra-complexos, gerencia estados e automatiza o impossível em segundos.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, x: 10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBuy(activePlans[2])}
                className="group relative flex items-center gap-4 bg-white text-black px-8 py-6 font-black text-xl hover:bg-cyan-400 transition-all w-full md:w-auto neon-glow"
              >
                INICIAR AGORA
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </motion.div>

            <div className="md:col-span-8 flex justify-end gap-12 opacity-30 select-none hidden md:flex">
              {[
                { icon: Globe, label: "ACESSO GLOBAL" },
                { icon: Cpu, label: "NÚCLEO NEURAL" },
                { icon: MousePointer2, label: "ZERO FRICÇÃO" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.3, y: 0 }}
                  transition={{ delay: 1 + (i * 0.2) }}
                  whileHover={{ opacity: 1, scale: 1.1, color: "#22d3ee" }}
                  className="flex flex-col items-end cursor-default"
                >
                  <item.icon className="w-20 h-20 mb-4" />
                  <span className="font-black text-4xl">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div style={{ y: y1, rotate: rotate }} className="absolute top-1/4 right-[5%] w-64 h-64 border-[1px] border-white/10 hidden lg:block" />
        <motion.div style={{ y: y2, rotate: -rotate }} className="absolute bottom-[10%] left-[10%] w-40 h-40 border-[1px] border-cyan-500/20 hidden lg:block" />
      </section>

      {/* FEATURE FRAGMENTS */}
      <section id="funcionalidades" className="py-20 px-8 max-w-[1800px] mx-auto border-t-[1px] border-white/10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-1px bg-white/10 border-[1px] border-white/10"
        >
          {[
            { title: "GERAÇÃO PODEROSA", desc: "Algoritmos avançados que entendem contexto complexo e geram estruturas prontas para produção." },
            { title: "DEBUG AUTÔNOMO", desc: "Identifica erros de lógica antes mesmo de você rodar o código no navegador." },
            { title: "ARQUITETURA LIMPA", desc: "Mantém seu projeto Lovable organizado com padrões de design de nível sênior." }
          ].map((f, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="bg-[#020617] p-12 hover:bg-slate-900 transition-colors group cursor-default"
            >
              <span className="text-cyan-500 font-black text-3xl mb-4 block translate-y-0 group-hover:-translate-y-2 transition-transform">0{i + 1}</span>
              <h3 className="text-2xl font-black mb-6 uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Plans */}
      <section id="planos" className="py-32 px-8 bg-white/5 relative">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-20"
          >
            <h2 className="text-8xl font-black tracking-tighter uppercase mb-4 leading-none">Escolha <br />Sua <span className="text-cyan-500">Arma</span>.</h2>
            <p className="text-slate-400 max-w-xl font-medium uppercase tracking-widest text-xs">Ativação instantânea via WhatsApp direto no seu celular após o checkout.</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {activePlans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                whileHover={{ y: -20, transition: { duration: 0.3 } }}
                className={`glass-brutalist p-10 flex flex-col min-h-[500px] ${plan.popular ? "bg-cyan-500/5" : ""
                  }`}
              >
                {plan.popular && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-cyan-500 text-black px-4 py-1 font-black text-[10px] uppercase tracking-tighter self-start mb-8"
                  >
                    Recomendado
                  </motion.div>
                )}
                <div className="mb-auto">
                  <motion.div
                    whileHover={{ rotate: 15, scale: 1.2 }}
                    className="mb-10 opacity-80"
                  >
                    {plan.icon}
                  </motion.div>
                  <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">{plan.name}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">{plan.description}</p>
                  <div className="flex flex-col gap-1 mb-8">
                    {plan.price === "Comercial" ? (
                      <span className="text-2xl font-black text-cyan-400 uppercase leading-tight">Entre em contato com o comercial</span>
                    ) : (
                      <div className="flex flex-col">
                        {plan.originalPrice && (
                          <span className="text-slate-500 text-sm font-bold line-through ml-1 mb-[-4px]">
                            DE: R$ {typeof plan.originalPrice === 'number' ? plan.originalPrice.toFixed(2).replace('.', ',') : plan.originalPrice}
                          </span>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-slate-500 font-bold text-sm">R$</span>
                          <span className="text-4xl xl:text-5xl font-black text-white">{plan.price}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-10 text-xs font-black uppercase text-slate-400">
                  {["Acesso Total à Extensão", "Grupo VIP de Alunos", "Suporte Técnico 24/7"].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <motion.div
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        className="w-1.5 h-1.5 bg-cyan-500 rounded-none"
                      />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (plan.price === "Comercial") {
                      window.open("https://wa.me/5584996706253", "_blank");
                    } else {
                      handleBuy(plan);
                    }
                  }}
                  className={`group relative w-full py-5 font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${plan.popular ? "bg-cyan-500 text-black shadow-[4px_4px_0px_white]" : "bg-white text-black shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-cyan-500/50"
                    }`}>
                  {plan.price === "Comercial" ? <MessageCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                  {plan.price === "Comercial" ? "Falar no WhatsApp" : "CONFIRMAR PEDIDO"}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Credit Packages Section */}
      <section id="creditos" className="py-32 px-8 bg-gradient-to-b from-black to-purple-950/20 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-4 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Venda de <br />Créditos Lovable
            </h2>
            <div className="flex items-center justify-center gap-4 text-pink-500 font-black uppercase tracking-[0.3em] text-xs md:text-sm">
                <Heart className="w-5 h-5 fill-pink-500" />
                <span>100% Garantido • Com Garantia</span>
                <Heart className="w-5 h-5 fill-pink-500" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creditPlans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.05, translateY: -10 }}
                className="bg-slate-900/40 border border-purple-500/30 p-8 rounded-3xl backdrop-blur-xl relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between mb-8">
                    <div className="p-3 bg-purple-500/20 rounded-2xl">
                        <Heart className="text-pink-500 w-6 h-6 fill-pink-500" />
                    </div>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-white">
                    {plan.credits} Créditos
                </h3>
                <p className="text-slate-400 text-xs mb-8 font-medium italic">
                    {plan.description}
                </p>

                <div className="flex flex-col mb-10">
                    {plan.originalPrice && (
                        <span className="text-slate-500 text-sm font-bold line-through ml-1 mb-[-4px]">
                            DE: R$ {typeof plan.originalPrice === 'number' ? plan.originalPrice.toFixed(2).replace('.', ',') : plan.originalPrice}
                        </span>
                    )}
                    <div className="flex items-baseline gap-2">
                        <span className="text-pink-500 font-bold text-sm">R$</span>
                        <span className="text-4xl font-black text-white">
                            {typeof plan.price === 'number' ? plan.price.toFixed(2).replace('.', ',') : plan.price}
                        </span>
                    </div>
                </div>

                <button
                  onClick={() => {
                    const formattedPlan = {
                        id: plan.id,
                        name: plan.name,
                        price: typeof plan.price === 'number' ? plan.price.toFixed(2).replace('.', ',') : plan.price,
                        description: plan.description || "",
                        durationDays: plan.durationDays || null
                    };
                    handleBuy(formattedPlan as any);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-pink-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer z-50 relative"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Comprar Créditos
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-purple-500/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/10 blur-[150px] rounded-full -z-10" />
      </section>

      {/* Trust & Stats */}
      <section className="py-20 px-8 border-y border-white/10 bg-black overflow-hidden">
        <div className="max-w-[1800px] mx-auto flex flex-wrap justify-between items-center gap-12">
          {[
            { label: "Uptime", val: "99.9%" },
            { label: "Nós Ativos", val: "1.2K" },
            { label: "Linhagem", val: "Ver. Alpha" },
            { label: "Segurança", val: "AES-256" }
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring" }}
              className="flex flex-col"
            >
              <span className="text-slate-600 font-black text-[10px] uppercase tracking-widest">{s.label}</span>
              <motion.span
                whileInView={{ opacity: [0, 1], x: [-20, 0] }}
                className="text-white font-black text-5xl tracking-tighter"
              >
                {s.val}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 bg-[#020617] relative">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 grayscale">
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <ZapIcon className="text-black w-4 h-4" />
              </div>
              <span className="text-xl font-black uppercase tracking-tighter">mega_2ai</span>
            </div>
            <p className="text-slate-600 text-xs max-w-xs uppercase leading-loose font-bold">
              A extensão que transforma seu fluxo de trabalho no Lovable em uma arma de destruição massiva de bugs.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-12 text-xs font-black uppercase tracking-widest text-right">
            <a href={links.whatsappAdmin} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-white transition-colors underline decoration-2 underline-offset-4">(84) 99670-6253</a>
            <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Documentação</a>
            <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacidade</a>
            <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Termos de Uso</a>
            <span className="text-slate-800">© 2026 UNIDADE ALPHA</span>
          </div>
        </div>
      </footer>

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planId={selectedPlan?.id || ""}
        planName={selectedPlan?.name || ""}
        price={String(selectedPlan?.price || "")}
        originalPrice={selectedPlan?.originalPrice ? (typeof selectedPlan.originalPrice === 'number' ? selectedPlan.originalPrice.toFixed(2).replace('.', ',') : selectedPlan.originalPrice) : null}
      />

      {/* Floating Buttons Container */}
      <div className="fixed bottom-8 right-8 z-[150] flex flex-col gap-4 items-end">
        {/* Community Button */}
        <motion.a
          href={links.communityUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-yellow-500 text-black p-4 rounded-none shadow-[4px_4px_0px_white] flex items-center gap-3 transition-transform group"
        >
          <Users className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase text-xs whitespace-nowrap">
            Entrar na Comunidade
          </span>
        </motion.a>

        {/* Floating WhatsApp Button */}
        <motion.a
          href={links.whatsappAdmin}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-emerald-500 text-white p-4 rounded-none shadow-[4px_4px_0px_white] flex items-center gap-3 transition-transform group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase text-xs whitespace-nowrap">
            Falar com Especialista
          </span>
        </motion.a>
      </div>
    </div>
  );
}
