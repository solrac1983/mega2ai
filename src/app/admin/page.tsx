"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Save,
    Download,
    Users,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    LayoutDashboard,
    Settings as SettingsIcon,
    History,
    TrendingUp,
    Zap,
    DollarSign,
    UserPlus,
    FileCode,
    LogOut,
    Search,
    RefreshCw,
    Upload,
    Bell,
    Send,
    X,
    MessageSquare,
    Edit,
    Trash2,
    Lock,
    Package,
    Tag
} from "lucide-react";

import CouponsView from "@/components/CouponsView";

type Tab = "dashboard" | "clients" | "settings" | "team" | "plans" | "coupons";

interface DashboardData {
    stats: {
        totalClients: number;
        approvedSales: number;
        freeTrials: number;
        totalRevenue: number;
        monthlyRevenue: number;
        totalAdmins: number;
        conversionRate: string;
    };
    recentClients: {
        id: string;
        name: string;
        email: string;
        whatsapp: string;
        createdAt: string;
    }[];
    salesByPlan: {
        amount: number;
        _count: { id: number };
        _sum: { amount: number };
    }[];
    topCoupons?: {
        id: string;
        code: string;
        usedCount: number;
    }[];
}

interface AdminUser {
    id: string;
    username: string;
    name: string | null;
    createdAt: string;
}

interface Plan {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    originalPrice?: number | string | null;
    durationDays: number | null;
    credits?: number | null;
    type?: 'LICENSE' | 'CREDITS';
    icon?: string;
}

interface Client {
    id: string;
    name: string;
    email: string;
    whatsapp: string;
    credits: number;
    createdAt: string;
    payments: { status: string; createdAt: string }[];
    licenses?: { planId: string; expiresAt: string | null; plan: Plan; status: string; lastUsedAt: string | null }[];
    planId?: string;
}

interface Settings {
    extensionUrl: string;
    customerGroupName: string;
    customerGroupUrl: string;
    communityGroupName: string;
    communityGroupUrl: string;
    videoUrl: string;
}

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState("");
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ username: "", password: "", name: "" });
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({ name: "", email: "", whatsapp: "", planId: "" });

    // Data states
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [settings, setSettings] = useState<Settings>({
        extensionUrl: "",
        customerGroupName: "",
        customerGroupUrl: "",
        communityGroupName: "",
        communityGroupUrl: "",
        videoUrl: "",
    });

    const fetchData = async () => {
        setFetching(true);
        try {
            const [dashRes, clientsRes, settingsRes, adminsRes, plansRes] = await Promise.all([
                fetch("/api/admin/dashboard"),
                fetch("/api/admin/clients"),
                fetch("/api/admin/settings"),
                fetch("/api/admin/users"),
                fetch("/api/public/plans")
            ]);

            const dash: DashboardData = await dashRes.json();
            const cls: Client[] = await clientsRes.json();
            const sett: Settings = await settingsRes.json();
            const adms: AdminUser[] = await adminsRes.json();
            const plns: Plan[] = await plansRes.json();

            setDashboardData(dash);
            setClients(cls);
            setSettings(sett);
            setAdmins(adms);
            setPlans(plns);
        } catch (error) {
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setMessage("Configurações atualizadas!");
                setTimeout(() => setMessage(""), 3000);
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao salvar configurações");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastMessage || selectedClients.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientIds: selectedClients,
                    message: broadcastMessage
                }),
            });
            if (res.ok) {
                alert("Mensagem enviada com sucesso!");
                setBroadcastMessage("");
                setSelectedClients([]);
                setIsNotifyModalOpen(false);
            } else {
                alert("Ocorreu um erro ao enviar a mensagem.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/clients/${editingClient.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingClient)
            });
            if (res.ok) {
                setMessage("Cliente atualizado!");
                setEditingClient(null);
                fetchData();
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/clients/${clientToDelete}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setMessage("Cliente excluído!");
                setIsDeleteDialogOpen(false);
                setClientToDelete(null);
                fetchData();
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newClient)
            });
            if (res.ok) {
                setMessage("Cliente criado!");
                setIsAddClientModalOpen(false);
                setNewClient({ name: "", email: "", whatsapp: "", planId: "" });
                fetchData();
                setTimeout(() => setMessage(""), 3000);
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao criar cliente");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAdmin)
            });
            if (res.ok) {
                setMessage("Administrador criado!");
                setIsAddAdminModalOpen(false);
                setNewAdmin({ username: "", password: "", name: "" });
                fetchData();
                setTimeout(() => setMessage(""), 3000);
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao criar admin");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAdmin = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este administrador?")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setMessage("Administrador removido!");
                fetchData();
                setTimeout(() => setMessage(""), 3000);
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao excluir admin");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.location.href = "/login";
    };

    if (fetching && !dashboardData) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-slate-950/50 backdrop-blur-xl flex flex-col p-6 fixed h-full z-50">
                <div className="flex items-center gap-3 mb-12">
                    <ShieldCheck className="text-cyan-500 w-8 h-8" />
                    <span className="font-black text-xl tracking-tighter uppercase font-display">MEGA_2AI</span>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    <SidebarLink
                        active={activeTab === "dashboard"}
                        onClick={() => setActiveTab("dashboard")}
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                    />
                    <SidebarLink
                        active={activeTab === "clients"}
                        onClick={() => setActiveTab("clients")}
                        icon={<Users size={20} />}
                        label="Clientes"
                    />
                    <SidebarLink
                        active={activeTab === "settings"}
                        onClick={() => setActiveTab("settings")}
                        icon={<SettingsIcon size={20} />}
                        label="Configurações"
                    />
                    <SidebarLink
                        active={activeTab === "plans"}
                        onClick={() => setActiveTab("plans")}
                        icon={<Package size={20} />}
                        label="Planos"
                    />
                    <SidebarLink
                        active={activeTab === "coupons"}
                        onClick={() => setActiveTab("coupons")}
                        icon={<Tag size={20} />}
                        label="Cupons"
                    />
                    <SidebarLink
                        active={activeTab === "team"}
                        onClick={() => setActiveTab("team")}
                        icon={<Lock size={20} />}
                        label="Equipe"
                    />
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all outline-none font-bold text-sm"
                >
                    <LogOut size={20} />
                    Sair do Painel
                </button>
            </aside>

            {/* Content Area */}
            <div className="flex-1 ml-64 p-12">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">
                            {activeTab === "dashboard" && "Dashboard Geral"}
                            {activeTab === "clients" && "Gestão de Leads"}
                            {activeTab === "settings" && "Configurações Globais"}
                            {activeTab === "team" && "Equipe Administrativa"}
                            {activeTab === "plans" && "Planos Comerciais"}
                            {activeTab === "coupons" && "Cupons Promocionais"}
                        </h1>
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">
                            {activeTab === "dashboard" ? "Acompanhamento em tempo real" : "Gerenciamento da plataforma"}
                        </p>
                    </div>

                    <button
                        onClick={fetchData}
                        className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all"
                        title="Atualizar dados"
                    >
                        <RefreshCw size={18} className={fetching ? "animate-spin" : ""} />
                    </button>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "dashboard" && dashboardData && <DashboardView data={dashboardData} />}
                        {activeTab === "clients" && (
                            <ClientsView
                                clients={clients}
                                selectedClients={selectedClients}
                                setSelectedClients={setSelectedClients}
                                onNotify={() => setIsNotifyModalOpen(true)}
                                onEdit={(client) => setEditingClient(client)}
                                onDelete={(id) => {
                                    setClientToDelete(id);
                                    setIsDeleteDialogOpen(true);
                                }}
                                onAdd={() => setIsAddClientModalOpen(true)}
                                setLoading={setLoading}
                            />
                        )}
                        {activeTab === "settings" && (
                            <SettingsView
                                settings={settings}
                                setSettings={setSettings}
                                onSave={handleSaveSettings}
                                loading={loading}
                                message={message}
                            />
                        )}
                        {activeTab === "team" && (
                            <TeamView
                                admins={admins}
                                onAdd={() => setIsAddAdminModalOpen(true)}
                                onDelete={handleDeleteAdmin}
                            />
                        )}
                        {activeTab === "plans" && (
                            <PlansView
                                initialPlans={plans}
                                onRefresh={fetchData}
                            />
                        )}
                        {activeTab === "coupons" && (
                            <CouponsView />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Notification Modal */}
            <AnimatePresence>
                {/* Modal Notificar Selecionados */}
                {isNotifyModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsNotifyModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="glass-card w-full max-w-xl p-8 rounded-3xl relative z-10"
                        >
                            <button onClick={() => setIsNotifyModalOpen(false)} title="Fechar" className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-4 mb-8 text-emerald-500">
                                <Bell className="w-8 h-8" />
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Broadcast WhatsApp</h2>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Sua Mensagem</label>
                                    <textarea
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm h-40 outline-none focus:border-cyan-500/50 transition-all resize-none"
                                        placeholder="Digite a mensagem que será enviada para os clientes selecionados..."
                                    />
                                </div>
                                <button
                                    onClick={handleBroadcast}
                                    disabled={loading || !broadcastMessage}
                                    className="w-full bg-cyan-500 text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Enviar Notificação
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Modal Editar Cliente */}
                {editingClient && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setEditingClient(null)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="glass-card w-full max-w-md p-8 rounded-3xl relative z-10"
                        >
                            <button onClick={() => setEditingClient(null)} title="Fechar" className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Editar Cliente</h2>
                            <form onSubmit={handleUpdateClient} className="space-y-4">
                                <div>
                                    <label htmlFor="edit_name" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Nome</label>
                                    <input
                                        id="edit_name"
                                        value={editingClient.name}
                                        onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit_email" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Email</label>
                                    <input
                                        id="edit_email"
                                        value={editingClient.email}
                                        onChange={e => setEditingClient({ ...editingClient, email: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit_whatsapp" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">WhatsApp</label>
                                    <input
                                        id="edit_whatsapp"
                                        value={editingClient.whatsapp}
                                        onChange={e => setEditingClient({ ...editingClient, whatsapp: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit_planId" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Licença/Plano Ativo</label>
                                    <select
                                        id="edit_planId"
                                        value={editingClient.planId !== undefined ? editingClient.planId : (editingClient.licenses?.[0]?.planId || "")}
                                        onChange={e => setEditingClient({ ...editingClient, planId: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                                    >
                                        <option value="">Nenhuma Licença / Não Atribuir</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-cyan-500 text-slate-950 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-cyan-400 transition-all disabled:opacity-50 mt-4"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar Alterações"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Modal Cadastrar Cliente */}
                {isAddClientModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsAddClientModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="glass-card w-full max-w-md p-8 rounded-3xl relative z-10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Novo Cliente</h2>
                                <button onClick={() => setIsAddClientModalOpen(false)} className="text-slate-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateClient} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={newClient.name}
                                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                        className="w-full bg-black/60 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-cyan-500/50 outline-none transition-all"
                                        placeholder="Ex: Carlos Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">E-mail</label>
                                    <input
                                        type="email"
                                        required
                                        value={newClient.email}
                                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                        className="w-full bg-black/60 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-cyan-500/50 outline-none transition-all"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">WhatsApp (DDD + Número)</label>
                                    <input
                                        type="text"
                                        required
                                        value={newClient.whatsapp}
                                        onChange={(e) => setNewClient({ ...newClient, whatsapp: e.target.value })}
                                        className="w-full bg-black/60 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-cyan-500/50 outline-none transition-all"
                                        placeholder="5584999999999"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Atribuir Licença (Opcional)</label>
                                    <select
                                        value={newClient.planId}
                                        title="Atribuir Licença"
                                        onChange={(e) => setNewClient({ ...newClient, planId: e.target.value })}
                                        className="w-full bg-black/60 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-cyan-500/50 outline-none transition-all appearance-none"
                                    >
                                        <option value="">Apenas Lead (Sem Licença)</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    {plans.length === 0 && (
                                        <p className="text-[10px] text-amber-500 mt-2 font-bold uppercase tracking-tighter">
                                            ⚠️ Nenhum plano encontrado. Rode o seed/configuração primeiro.
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-cyan-500 text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cadastrar Cliente"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Modal Excluir Cliente */}
                {isDeleteDialogOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="glass-card w-full max-w-sm p-8 rounded-3xl relative z-10 border border-red-500/20"
                        >
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-red-500">Excluir Cliente?</h2>
                            <p className="text-slate-400 text-sm mb-8">
                                Esta ação é irreversível. Todas as licenças e pagamentos deste cliente também serão removidos.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                    className="flex-1 bg-white/5 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteClient}
                                    disabled={loading}
                                    className="flex-1 bg-red-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-400 transition-all disabled:opacity-50 flex items-center justify-center"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Excluir"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Modal Cadastrar Admin */}
                {isAddAdminModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsAddAdminModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="glass-card w-full max-w-md p-8 rounded-3xl relative z-10"
                        >
                            <button onClick={() => setIsAddAdminModalOpen(false)} title="Fechar" className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Novo Administrador</h2>
                            <form onSubmit={handleCreateAdmin} className="space-y-4">
                                <div>
                                    <label htmlFor="new_admin_name" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Nome Completo</label>
                                    <input
                                        id="new_admin_name"
                                        placeholder="Ex: Carlos Silva"
                                        value={newAdmin.name}
                                        onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="new_admin_user" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Usuário (Login)</label>
                                    <input
                                        id="new_admin_user"
                                        placeholder="Ex: carlossilva"
                                        value={newAdmin.username}
                                        onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="new_admin_pass" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Senha Provisória</label>
                                    <input
                                        id="new_admin_pass"
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newAdmin.password}
                                        onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !newAdmin.username || !newAdmin.password}
                                    className="w-full bg-cyan-500 text-slate-950 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-cyan-400 transition-all disabled:opacity-50 mt-4"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Criar Acesso"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${active
                ? "bg-cyan-500 text-slate-950 shadow-[0_10px_20px_rgba(6,182,212,0.2)]"
                : "text-slate-500 hover:text-white hover:bg-white/5"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function DashboardView({ data }: { data: DashboardData }) {
    if (!data) return null;

    return (
        <div className="space-y-12">
            {/* Grid Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users className="text-cyan-500" />} label="Total de Leads" value={data.stats.totalClients} />
                <StatCard
                    icon={<TrendingUp className="text-emerald-500" />}
                    label="Receita Mensal"
                    value={`R$ ${data.stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <StatCard
                    icon={<CheckCircle2 className="text-cyan-500" />}
                    label="Conversões Pagas"
                    value={data.stats.approvedSales}
                />
                <StatCard
                    icon={<Download className="text-amber-500" />}
                    label="Trials Gratuitos"
                    value={data.stats.freeTrials}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                <div className="xl:col-span-2 space-y-12">
                    {/* Performance de Tiers */}
                    <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                <History size={20} className="text-cyan-500" />
                                Performance de Tiers
                            </h3>
                            <div className="text-cyan-500 bg-cyan-500/10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-cyan-500/20">
                                Total: R$ {data.stats.totalRevenue.toLocaleString()}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {data.salesByPlan.map((s, idx) => (
                                <div key={idx} className="bg-black/40 p-6 rounded-3xl border border-white/5 hover:border-cyan-500/20 transition-all flex justify-between items-center group/item">
                                    <div>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Valor Unitário</p>
                                        <p className="text-lg font-black font-mono">R$ {s.amount.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-cyan-500 text-lg font-black">{s._count.id} <span className="text-[10px] text-slate-500 uppercase">Vendas</span></p>
                                        <p className="text-[10px] text-emerald-500/60 font-mono">Subtotal: R$ {s._sum.amount?.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Cupons */}
                    {data.topCoupons && data.topCoupons.length > 0 && (
                        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40">
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-2">
                                <Tag size={20} className="text-amber-500" />
                                Top Cupons em Conversão
                            </h3>
                            <div className="space-y-4">
                                {data.topCoupons.map((coupon) => (
                                    <div key={coupon.id} className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-white/5 group hover:border-cyan-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-cyan-500/10 p-3 rounded-xl">
                                                <Tag className="w-5 h-5 text-cyan-500" />
                                            </div>
                                            <div>
                                                <span className="font-mono font-black text-cyan-500 tracking-tighter text-lg">{coupon.code}</span>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Cupom Ativo</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white">{coupon.usedCount}</span>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Usos</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Novos Leads Side */}
                <div className="xl:col-span-1 space-y-8">
                    <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 h-full">
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-2">
                            <Users size={20} className="text-emerald-500" />
                            Novos Leads
                        </h3>
                        <div className="space-y-6">
                            {data.recentClients.map((client) => (
                                <div key={client.id} className="flex flex-col gap-1 pb-6 border-b border-white/5 last:border-0 last:pb-0 hover:translate-x-1 transition-transform cursor-pointer group">
                                    <p className="font-bold text-sm truncate group-hover:text-cyan-400 transition-colors">{client.name}</p>
                                    <div className="flex items-center justify-between text-[10px] font-mono">
                                        <span className="text-slate-500">@{client.whatsapp.slice(-8)}</span>
                                        <span className="text-slate-600 uppercase font-black">{new Date(client.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClientsView({ clients, selectedClients, setSelectedClients, onNotify, onEdit, onDelete, onAdd, setLoading }: {
    clients: Client[],
    selectedClients: string[],
    setSelectedClients: (ids: string[]) => void,
    onNotify: () => void,
    onEdit: (client: Client) => void,
    onDelete: (id: string) => void,
    onAdd: () => void,
    setLoading: (loading: boolean) => void
}) {
    const [search, setSearch] = useState("");

    const toggleClient = (id: string) => {
        if (selectedClients.includes(id)) {
            setSelectedClients(selectedClients.filter(i => i !== id));
        } else {
            setSelectedClients([...selectedClients, id]);
        }
    };

    const toggleAll = () => {
        if (selectedClients.length === filtered.length) {
            setSelectedClients([]);
        } else {
            setSelectedClients(filtered.map(c => c.id));
        }
    };

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.whatsapp.includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-3xl border border-white/5">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou WhatsApp..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent border-none rounded-2xl pl-12 pr-6 py-3 outline-none transition-all font-medium text-sm"
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onAdd}
                        className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all"
                    >
                        <UserPlus size={16} className="text-cyan-500" />
                        Novos Clientes
                    </button>

                    {selectedClients.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={onNotify}
                            className="bg-cyan-500 text-slate-950 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-lg"
                        >
                            <MessageSquare size={16} />
                            Notificar Selecionados ({selectedClients.length})
                        </motion.button>
                    )}
                </div>
            </div>

            <div className="glass-card rounded-3xl border border-white/5 bg-slate-900/40 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-black/20 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                            <th className="px-8 py-6 w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedClients.length === filtered.length && filtered.length > 0}
                                    onChange={toggleAll}
                                    className="w-4 h-4 bg-slate-800 border-white/10 rounded"
                                />
                            </th>
                            <th className="px-8 py-6">Cliente</th>
                            <th className="px-8 py-6">WhatsApp</th>
                            <th className="px-8 py-6">Status Pagamento</th>
                            <th className="px-8 py-6">Licença (Restante)</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Cadastro</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Saldo</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map((client) => {
                            const lastPayment = client.payments[0];
                            const isSelected = selectedClients.includes(client.id);
                            return (
                                <tr
                                    key={client.id}
                                    className={`hover:bg-white/5 transition-colors group cursor-pointer ${isSelected ? "bg-cyan-500/5" : ""}`}
                                    onClick={() => toggleClient(client.id)}
                                >
                                    <td className="px-8 py-6">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => { }} // Handle by TR click
                                            className="w-4 h-4 bg-slate-800 border-white/10 rounded"
                                        />
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-sm group-hover:text-cyan-400 transition-colors">{client.name}</p>
                                        <p className="text-slate-500 text-xs">{client.email}</p>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-mono">{client.whatsapp}</td>
                                    <td className="px-8 py-6">
                                        {lastPayment ? (
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${lastPayment.status === "APPROVED"
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-yellow-500/10 text-yellow-500"
                                                }`}>
                                                {lastPayment.status === "APPROVED" ? "Aprovado" : "Pendente"}
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest italic">Apenas Lead</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        {client.licenses && client.licenses.length > 0 ? (() => {
                                            const lic = client.licenses[0];
                                            if (!lic.expiresAt) return <span className="text-emerald-500 font-bold text-xs uppercase bg-emerald-500/10 px-3 py-1 rounded-full">{lic.plan.name} (Vitalício)</span>;

                                            const diffMs = new Date(lic.expiresAt).getTime() - Date.now();

                                            if (lic.planId === "free") {
                                                const mins = Math.ceil(diffMs / (1000 * 60));
                                                return mins > 0 ? (
                                                    <span className="text-cyan-500 font-bold block text-xs">{mins} minutos restantes ({lic.plan.name})</span>
                                                ) : (
                                                    <span className="text-red-500 font-bold block text-xs">Expirado ({lic.plan.name})</span>
                                                );
                                            } else {
                                                const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                                                return days > 0 ? (
                                                    <span className="text-cyan-500 font-bold block text-xs">{days} dias restantes ({lic.plan.name})</span>
                                                ) : (
                                                    <span className="text-red-500 font-bold block text-xs">Expirado ({lic.plan.name})</span>
                                                );
                                            }
                                        })() : (
                                            <span className="text-slate-600 font-mono text-xs">Sem Licença</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-slate-500">
                                        {new Date(client.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                            <span className="text-xs font-black text-pink-500">{client.credits || 0} CR</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!confirm(`Deseja reenviar o kit de acesso para ${client.name}?`)) return;
                                                    setLoading(true);
                                                    try {
                                                        const res = await fetch(`/api/admin/clients/${client.id}/access`, { method: "POST" });
                                                        if (res.ok) {
                                                            alert("Kit de acesso enviado!");
                                                        } else {
                                                            const err = await res.json();
                                                            alert(err.error || "Erro ao enviar");
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                                                title="Enviar Kit de Acesso"
                                            >
                                                <Send size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(client); }}
                                                className="p-2 text-slate-500 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-xl transition-all"
                                                title="Editar Cliente"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
                                                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Excluir Cliente"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SettingsView({ settings, setSettings, onSave, loading, message }: {
    settings: Settings,
    setSettings: React.Dispatch<React.SetStateAction<Settings>>,
    onSave: () => void,
    loading: boolean,
    message: string
}) {
    const [localUploading, setLocalUploading] = useState(false);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Extensão */}
                <section className="glass-card p-8 rounded-3xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FileCode size={120} />
                    </div>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-2xl">
                                <Download className="text-emerald-500 w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold font-display uppercase tracking-tight">Arquivo da Extensão</h2>
                                <p className="text-slate-500 text-xs mt-1">Este arquivo é entregue automaticamente via WhatsApp</p>
                            </div>
                        </div>

                        <label className={`
                            relative overflow-hidden px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all border
                            ${localUploading
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500 cursor-not-allowed"
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            }
                        `}>
                            {localUploading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Upload size={16} className="text-emerald-500" />
                            )}
                            {localUploading ? "Enviando..." : "Fazer Upload"}
                            <input
                                id="upload-zip"
                                type="file"
                                className="sr-only"
                                accept=".zip"
                                disabled={localUploading}
                                title="Selecionar arquivo .zip da extensão"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    setLocalUploading(true);
                                    const formData = new FormData();
                                    formData.append("file", file);

                                    try {
                                        const res = await fetch("/api/admin/upload", {
                                            method: "POST",
                                            body: formData
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            setSettings((s: Settings) => ({ ...s, extensionUrl: data.url }));
                                            alert("Extensão atualizada com sucesso!");
                                        } else {
                                            alert("Falha: " + (data.error || "Desconhecido"));
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert("Erro ao subir arquivo");
                                    } finally {
                                        setLocalUploading(false);
                                        e.target.value = ""; // Reset input
                                    }
                                }}
                            />
                        </label>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div>
                            <label htmlFor="extension-url" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">URL Direta para Versão Atual (.zip)</label>
                            <input
                                id="extension-url"
                                type="text"
                                value={settings.extensionUrl}
                                onChange={(e) => setSettings({ ...settings, extensionUrl: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-emerald-400 font-mono text-sm focus:border-emerald-500/50 outline-none transition-all"
                                placeholder="https://mega2ai.com/download/version.zip"
                                title="URL da Extensão"
                            />
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                            <p className="text-emerald-400/80 text-[11px] leading-relaxed">
                                💡 <strong>Dica de Atualização:</strong> Você pode clicar no botão <b>Fazer Upload</b> acima para subir o novo arquivo .ZIP diretamente para o servidor. O sistema atualizará o link automaticamente.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Tutorial / Vídeo */}
                <section className="glass-card p-8 rounded-3xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-purple-500/20 rounded-2xl">
                            <FileCode className="text-purple-500 w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-display uppercase tracking-tight">Vídeo Tutorial</h2>
                            <p className="text-slate-500 text-xs mt-1">Link enviado para o cliente após a compra</p>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div>
                            <label htmlFor="videoUrl" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Link do Vídeo (YouTube/Vimeo)</label>
                            <input
                                id="videoUrl"
                                type="text"
                                value={settings.videoUrl}
                                onChange={(e) => setSettings({ ...settings, videoUrl: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-purple-400 font-mono text-sm focus:border-purple-500/50 outline-none transition-all"
                                placeholder="https://youtube.com/watch?v=..."
                                title="URL do vídeo tutorial"
                            />
                        </div>
                    </div>
                </section>

                {/* Grupos */}
                <section className="glass-card p-8 rounded-3xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-cyan-500/20 rounded-2xl">
                            <Users className="text-cyan-500 w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-display uppercase tracking-tight">Comunicação WhatsApp</h2>
                            <p className="text-slate-500 text-xs mt-1">Links de convite gerados após a conversão</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-4">Fluxo Pós-Venda</h3>
                            <div>
                                <label htmlFor="customerGroupName" className="block text-[10px] font-bold text-slate-600 uppercase mb-2 ml-1">Nome do Grupo VIP</label>
                                <input
                                    id="customerGroupName"
                                    type="text"
                                    value={settings.customerGroupName}
                                    onChange={(e) => setSettings({ ...settings, customerGroupName: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:border-cyan-500/50 outline-none transition-all"
                                    placeholder="Ex: Grupo VIP"
                                    title="Nome do grupo VIP"
                                />
                            </div>
                            <div>
                                <label htmlFor="customerGroupUrl" className="block text-[10px] font-bold text-slate-600 uppercase mb-2 ml-1">Link de Convite (WhatsApp)</label>
                                <input
                                    id="customerGroupUrl"
                                    type="text"
                                    value={settings.customerGroupUrl}
                                    onChange={(e) => setSettings({ ...settings, customerGroupUrl: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-cyan-400 font-mono text-[10px] focus:border-cyan-500/50 outline-none transition-all"
                                    placeholder="https://chat.whatsapp.com/..."
                                    title="Link do grupo VIP"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-4">Fluxo de Nutrição</h3>
                            <div>
                                <label htmlFor="communityGroupName" className="block text-[10px] font-bold text-slate-600 uppercase mb-2 ml-1">Nome da Comunidade</label>
                                <input
                                    id="communityGroupName"
                                    type="text"
                                    value={settings.communityGroupName}
                                    onChange={(e) => setSettings({ ...settings, communityGroupName: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:border-yellow-500/50 outline-none transition-all"
                                    placeholder="Ex: Comunidade Alpha"
                                    title="Nome da comunidade"
                                />
                            </div>
                            <div>
                                <label htmlFor="communityGroupUrl" className="block text-[10px] font-bold text-slate-600 uppercase mb-2 ml-1">Link de Convite (WhatsApp)</label>
                                <input
                                    id="communityGroupUrl"
                                    type="text"
                                    value={settings.communityGroupUrl}
                                    onChange={(e) => setSettings({ ...settings, communityGroupUrl: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-yellow-400 font-mono text-[10px] focus:border-yellow-500/50 outline-none transition-all"
                                    placeholder="https://chat.whatsapp.com/..."
                                    title="Link da comunidade"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="space-y-8">
                <section className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-900/40">
                    <h3 className="font-bold mb-4 uppercase text-xs tracking-widest text-slate-400">Publicar Mudanças</h3>
                    <p className="text-slate-500 text-[10px] mb-6 leading-relaxed">
                        As alterações nos links e grupos entram em vigor imediatamente para todos os novos checkouts e mensagens automáticas.
                    </p>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-6 text-emerald-500 text-xs font-bold flex items-center gap-2"
                        >
                            <CheckCircle2 size={16} />
                            {message}
                        </motion.div>
                    )}

                    <button
                        onClick={onSave}
                        disabled={loading}
                        className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-cyan-500 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.05)] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Salvar Ajustes
                    </button>
                </section>

                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl">
                    <h4 className="text-blue-400 font-bold text-xs uppercase mb-2">Suporte do Desenvolvedor</h4>
                    <p className="text-slate-500 text-[10px] leading-relaxed mb-4">
                        Caso precise gerenciar licenças manualmente ou visualizar logs do servidor, acesse o painel da VPS ou contate o suporte.
                    </p>
                    <a href="https://wa.me/5584996706253" target="_blank" rel="noopener noreferrer" className="text-blue-400 text-[10px] font-bold hover:underline">
                        Abrir chamado técnico &rarr;
                    </a>
                </div>
            </div>
        </div>
    );
}

function TeamView({ admins, onAdd, onDelete }: { admins: AdminUser[], onAdd: () => void, onDelete: (id: string) => void }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-white/5">
                <div>
                    <h2 className="text-xl font-bold font-display uppercase tracking-tight">Equipe Administrativa</h2>
                    <p className="text-slate-500 text-xs mt-1">Gerencie quem tem acesso a este painel</p>
                </div>
                <button
                    onClick={onAdd}
                    className="bg-cyan-500 text-slate-950 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-lg"
                >
                    <UserPlus size={16} />
                    Novo Usuário
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {admins.map((admin) => (
                    <div key={admin.id} className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-900/40 relative group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-cyan-500/10 rounded-2xl">
                                <ShieldCheck className="text-cyan-500 w-6 h-6" />
                            </div>
                            <button
                                onClick={() => onDelete(admin.id)}
                                title="Excluir Administrador"
                                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div>
                            <p className="font-bold text-lg">{admin.name || "Sem Nome"}</p>
                            <p className="text-slate-500 text-sm font-mono mt-1">@{admin.username}</p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Membro desde</span>
                            <span className="text-[10px] font-mono text-slate-400">{new Date(admin.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
    return (
        <div className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-900/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="relative z-10">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
                <p className="text-xl font-black font-display text-white">{value}</p>
            </div>
        </div>
    );
}

function PlansView({ initialPlans, onRefresh }: { initialPlans: Plan[], onRefresh: () => void }) {
    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    useEffect(() => {
        setPlans(initialPlans);
    }, [initialPlans]);

    const handleSaveSingle = async (plan: Plan) => {
        setLoadingPlanId(plan.id);
        try {
            const res = await fetch("/api/admin/plans", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([plan])
            });
            if (res.ok) {
                setMessage(`Plano ${plan.name} atualizado!`);
                setTimeout(() => setMessage(""), 3000);
                onRefresh();
            } else {
                alert("Erro ao atualizar!");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingPlanId(null);
        }
    }

    const handleDeletePlan = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta oferta? Esta ação é irreversível.")) return;
        setLoadingPlanId(id);
        try {
            const res = await fetch(`/api/admin/plans?id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setMessage("Plano excluído!");
                setTimeout(() => setMessage(""), 3000);
                onRefresh();
            } else {
                alert("Erro ao excluir!");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingPlanId(null);
        }
    };

    const handleChange = (id: string, field: keyof Plan, value: any) => {
        setPlans(plans.map(p => p.id === id ? { ...p, [field]: value } : p));
    }

    const licensePlans = plans.filter(p => p.type === 'LICENSE' || !p.type);
    const creditPlans = plans.filter(p => p.type === 'CREDITS');

    return (
        <div className="space-y-16 pb-32">
            {/* Seção Superior de Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard 
                    label="Tiers de Licença" 
                    value={licensePlans.length} 
                    icon={<Zap className="text-cyan-400" size={16} />} 
                    trend="v2.5 Engine"
                />
                <MetricCard 
                    label="Pacotes de Créditos" 
                    value={creditPlans.length} 
                    icon={<DollarSign className="text-pink-400" size={16} />} 
                    trend="Ativo"
                />
                <MetricCard 
                    label="Preço Médio" 
                    value={`R$ ${(plans.reduce((acc, p) => acc + Number(p.price), 0) / (plans.length || 1)).toFixed(2)}`} 
                    icon={<TrendingUp className="text-emerald-400" size={16} />} 
                    trend="Estável"
                />
                <MetricCard 
                    label="Status da Vitrine" 
                    value="Online" 
                    icon={<CheckCircle2 className="text-blue-400" size={16} />} 
                    trend="Público"
                />
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                        <Package className="text-cyan-500 w-8 h-8" />
                        Arquitetura de Ofertas
                    </h2>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-[0.3em] font-mono leading-relaxed">
                        Engenharia de preços e limites do ecossistema <span className="text-white/50">MEGA_2AI</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={async () => {
                            if (confirm("Deseja criar os planos padrão?")) {
                                await fetch("/api/seed-db");
                                onRefresh();
                            }
                        }}
                        className="bg-white/[0.03] text-slate-400 border border-white/[0.08] px-5 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20 transition-all duration-500 group"
                    >
                        <RefreshCw size={12} className="inline mr-2 group-hover:rotate-180 transition-transform duration-700" />
                        Resetar Vitrine
                    </button>
                    <div className="flex items-center bg-white/[0.03] p-1 rounded-2xl border border-white/[0.08]">
                        <button
                            onClick={() => {
                                const newPlan: Plan = {
                                    id: `plan_${Date.now()}`,
                                    name: "Novo Plano",
                                    description: "",
                                    price: "0.00",
                                    durationDays: 30,
                                    credits: 0,
                                    type: 'LICENSE'
                                };
                                setPlans([...plans, newPlan]);
                            }}
                            className="bg-cyan-500 text-slate-950 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
                        >
                            <Zap size={14} /> + Licença
                        </button>
                        <button
                            onClick={() => {
                                const newPlan: Plan = {
                                    id: `credits_${Date.now()}`,
                                    name: "Novo Pacote",
                                    description: "",
                                    price: "0.00",
                                    durationDays: 365,
                                    credits: 100,
                                    type: 'CREDITS'
                                };
                                setPlans([...plans, newPlan]);
                            }}
                            className="bg-pink-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-pink-400 transition-all flex items-center gap-2 ml-1"
                        >
                            <DollarSign size={14} /> + Créditos
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-3xl text-emerald-500 text-xs font-bold flex items-center gap-3 backdrop-blur-xl"
                >
                    <div className="bg-emerald-500 p-1.5 rounded-lg text-slate-950">
                        <CheckCircle2 size={16} />
                    </div>
                    {message}
                </motion.div>
            )}

            {/* SEÇÃO 1: LICENÇAS TEMPORAIS */}
            <section className="space-y-8 relative">
                <div className="absolute -left-20 top-0 w-40 h-40 bg-cyan-500/5 blur-[100px] pointer-events-none rounded-full" />
                <div className="flex items-center justify-between pb-6 border-b border-white/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500/10 p-3 rounded-2xl">
                            <Zap className="text-cyan-500 w-5 h-5 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Licenças de Acesso</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Controle de tempo e permissões globais</p>
                        </div>
                    </div>
                    <span className="bg-black/40 border border-white/5 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest font-mono">
                        {licensePlans.length} ATIVOS
                    </span>
                </div>
                
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                    {licensePlans.length === 0 && (
                        <p className="text-slate-600 text-xs italic">Nenhuma licença configurada.</p>
                    )}
                    {licensePlans.map((plan) => (
                        <motion.div key={plan.id} variants={itemVariants}>
                            <PlanCard
                                plan={plan}
                                theme="cyan"
                                loadingId={loadingPlanId}
                                onSave={handleSaveSingle}
                                onChange={handleChange}
                                onDelete={handleDeletePlan}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* SEÇÃO 2: PACOTES DE CRÉDITOS */}
            <section className="space-y-8 relative">
                <div className="absolute -right-20 top-0 w-60 h-60 bg-pink-500/5 blur-[120px] pointer-events-none rounded-full" />
                <div className="flex items-center justify-between pb-6 border-b border-white/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="bg-pink-500/10 p-3 rounded-2xl">
                            <DollarSign className="text-pink-500 w-5 h-5 shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Pacotes de Créditos</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Controle de volume e consumo de IA</p>
                        </div>
                    </div>
                    <span className="bg-black/40 border border-white/5 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest font-mono">
                        {creditPlans.length} ATIVOS
                    </span>
                </div>
                
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                    {creditPlans.length === 0 && (
                        <p className="text-slate-600 text-xs italic">Nenhum pacote de créditos configurado.</p>
                    )}
                    {creditPlans.map((plan) => (
                        <motion.div key={plan.id} variants={itemVariants}>
                            <PlanCard
                                plan={plan}
                                theme="pink"
                                loadingId={loadingPlanId}
                                onSave={handleSaveSingle}
                                onChange={handleChange}
                                onDelete={handleDeletePlan}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </section>
        </div>
    );
}

function MetricCard({ label, value, icon, trend }: { label: string, value: string | number, icon: React.ReactNode, trend: string }) {
    return (
        <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-[2rem] hover:bg-white/[0.04] transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-black/40 p-3 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>
                <span className="text-[9px] font-mono font-black uppercase tracking-tighter text-slate-600 bg-black/20 px-2 py-1 rounded-lg">
                    {trend}
                </span>
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</h4>
            <div className="text-2xl font-black tracking-tighter">{value}</div>
        </div>
    );
}

function PlanCard({ plan, theme, loadingId, onSave, onChange, onDelete }: {
    plan: Plan,
    theme: 'cyan' | 'pink',
    loadingId: string | null,
    onSave: (p: Plan) => void,
    onChange: (id: string, field: keyof Plan, value: any) => void,
    onDelete: (id: string) => void
}) {
    const isNew = plan.id.startsWith("plan_") || plan.id.startsWith("credits_");
    const isLoading = loadingId === plan.id;

    return (
        <div
            className={`relative group rounded-[1.5rem] p-[1px] transition-all duration-700 ${theme === 'cyan' ? 'hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]' : 'hover:shadow-[0_0_40px_rgba(236,72,153,0.15)]'}`}
        >
            {/* Border de Glow Reagente */}
            <div className={`absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-white/[0.08] to-transparent group-hover:from-${theme}-500/40 transition-all duration-700`} />
            
            <div className="relative bg-slate-950/90 backdrop-blur-3xl rounded-[1.5rem] overflow-hidden flex flex-col h-full border border-white/[0.05]">
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme === 'cyan' ? 'from-cyan-500 to-blue-500' : 'from-pink-500 to-purple-500'} opacity-30`} />
                
                <div className="p-6 space-y-5 flex-1">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2 w-full">
                            <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-black/40 border border-white/5 ${theme === 'cyan' ? 'text-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-pink-500/80 shadow-[0_0_10px_rgba(236,72,153,0.2)]'}`}>
                                    Tier ID: {plan.id}
                                </span>
                                {isNew && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 animate-pulse">Draft</span>}
                            </div>
                            <input
                                type="text"
                                value={plan.name}
                                title="Nome do Plano"
                                onChange={(e) => onChange(plan.id, "name", e.target.value)}
                                className="text-3xl font-black uppercase tracking-tighter bg-transparent border-none outline-none focus:ring-0 p-0 w-full placeholder:text-slate-800 transition-all focus:text-white"
                                placeholder="Nome da Oferta"
                            />
                        </div>
                        <div className={`bg-black/40 p-4 rounded-2xl border border-white/10 group-hover:scale-110 transition-all duration-700 ${theme === 'cyan' ? 'group-hover:border-cyan-500/40' : 'group-hover:border-pink-500/40'}`}>
                            {theme === 'cyan' ? <Zap className="w-6 h-6 text-cyan-500" /> : <Package className="w-6 h-6 text-pink-500" />}
                        </div>
                    </div>

                    {/* Preços e Configurações */}
                    <div className="grid grid-cols-3 gap-3 mb-2">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">DE (R$)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                                <input
                                    type="text"
                                    value={plan.originalPrice || ""}
                                    placeholder="0,00"
                                    onChange={(e) => onChange(plan.id, "originalPrice", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs focus:border-cyan-500/50 outline-none transition-all font-mono"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">POR (R$)</label>
                            <div className="relative">
                                <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 ${theme === 'cyan' ? 'text-cyan-500' : 'text-pink-500'}`} />
                                <input
                                    type="text"
                                    value={plan.price}
                                    onChange={(e) => onChange(plan.id, "price", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs focus:border-cyan-500/50 outline-none transition-all font-bold font-mono"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Tipo</label>
                            <div className="relative">
                                <select
                                    value={plan.type || 'LICENSE'}
                                    title="Tipo de Oferta"
                                    onChange={(e) => onChange(plan.id, "type", e.target.value)}
                                    className={`w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] focus:border-${theme}-500/50 outline-none transition-all font-black uppercase tracking-widest appearance-none cursor-pointer`}
                                >
                                    <option value="LICENSE">Licença</option>
                                    <option value="CREDITS">Créditos</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                    <Tag size={12} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                {plan.type === 'CREDITS' ? "Créditos" : "Bônus Extensão"}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={plan.credits || ""}
                                    placeholder="0"
                                    title="Créditos"
                                    onChange={(e) => onChange(plan.id, "credits", e.target.value)}
                                    className={`w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 text-sm focus:border-${theme}-500/40 focus:bg-white/[0.05] outline-none transition-all font-mono font-black`}
                                />
                                <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-700" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                {plan.type === 'CREDITS' ? "Validade" : "Duração"}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={plan.durationDays || ""}
                                    placeholder="INF"
                                    title="Duração"
                                    onChange={(e) => onChange(plan.id, "durationDays", e.target.value)}
                                    className={`w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 text-sm focus:border-${theme}-500/40 focus:bg-white/[0.05] outline-none transition-all font-mono font-black`}
                                />
                                <History className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-700" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Pitch Comercial (Descrição)</label>
                        <textarea
                            rows={2}
                            value={plan.description || ""}
                            placeholder="Valor agregado da oferta..."
                            title="Descrição"
                            onChange={(e) => onChange(plan.id, "description", e.target.value)}
                            className={`w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-${theme}-500/40 focus:bg-white/[0.05] outline-none transition-all resize-none min-h-[80px] font-medium leading-relaxed`}
                        />
                    </div>
                </div>

                <div className="p-5 bg-black/40 backdrop-blur-2xl border-t border-white/[0.03] flex justify-between items-center">
                    <button
                        onClick={() => onDelete(plan.id)}
                        className="text-slate-600 hover:text-red-500 p-2 rounded-xl hover:bg-red-500/10 transition-all focus:outline-none"
                        title="Deletar Tier"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={() => onSave(plan)}
                        disabled={isLoading}
                        className={`relative overflow-hidden px-8 py-4 rounded-2xl font-black uppercase text-[9px] tracking-[0.3em] transition-all flex items-center gap-3 disabled:opacity-50 group hover:scale-[1.02] active:scale-[0.98] ${theme === 'cyan' ? 'bg-cyan-500 text-slate-950 shadow-[0_15px_30px_rgba(6,182,212,0.2)]' : 'bg-pink-500 text-white shadow-[0_15px_30px_rgba(236,72,153,0.2)]'}`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4 group-hover:rotate-12 transition-transform duration-500" />
                                <span>Sincronizar Protocolo</span>
                            </>
                        )}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-101%] group-hover:translate-x-[101%] transition-transform duration-700 ease-in-out" />
                    </button>
                </div>
            </div>
        </div>
    );
}
