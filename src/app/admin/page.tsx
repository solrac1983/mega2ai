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
    Lock
} from "lucide-react";

type Tab = "dashboard" | "clients" | "settings" | "team";

interface DashboardData {
    stats: {
        totalClients: number;
        approvedSales: number;
        freeTrials: number;
        totalRevenue: number;
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
}

interface AdminUser {
    id: string;
    username: string;
    name: string | null;
    createdAt: string;
}

interface Client {
    id: string;
    name: string;
    email: string;
    whatsapp: string;
    createdAt: string;
    payments: { status: string; createdAt: string }[];
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

    // Data states
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
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
            const [dashRes, clientsRes, settingsRes, adminsRes] = await Promise.all([
                fetch("/api/admin/dashboard"),
                fetch("/api/admin/clients"),
                fetch("/api/admin/settings"),
                fetch("/api/admin/users")
            ]);

            const dash: DashboardData = await dashRes.json();
            const cls: Client[] = await clientsRes.json();
            const sett: Settings = await settingsRes.json();
            const adms: AdminUser[] = await adminsRes.json();

            setDashboardData(dash);
            setClients(cls);
            setSettings(sett);
            setAdmins(adms);
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    icon={<UserPlus className="text-blue-500" />}
                    label="Total de Leads"
                    value={data.stats.totalClients}
                />
                <StatCard
                    icon={<RefreshCw className="text-purple-500" />}
                    label="Testes Grátis"
                    value={data.stats.freeTrials}
                />
                <StatCard
                    icon={<CheckCircle2 className="text-emerald-500" />}
                    label="Vendas Pagas"
                    value={data.stats.approvedSales}
                />
                <StatCard
                    icon={<DollarSign className="text-yellow-500" />}
                    label="Faturamento"
                    value={`R$ ${data.stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <StatCard
                    icon={<TrendingUp className="text-cyan-500" />}
                    label="Conversão (Vendas)"
                    value={`${data.stats.conversionRate}%`}
                />
                <StatCard
                    icon={<Lock className="text-pink-500" />}
                    label="Administradores"
                    value={data.stats.totalAdmins}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8 rounded-3xl border border-white/5 bg-slate-900/40">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <History size={20} className="text-cyan-500" />
                        Últimos Leads Registrados
                    </h3>
                    <div className="space-y-4">
                        {data.recentClients.map((client) => (
                            <div key={client.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div>
                                    <p className="font-bold text-sm">{client.name}</p>
                                    <p className="text-slate-500 text-xs">{client.email}</p>
                                </div>
                                <div className="text-right text-xs font-mono text-slate-400">
                                    {new Date(client.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 rounded-3xl border border-white/5 bg-slate-900/40">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <History size={20} className="text-cyan-500" />
                        Distribuição por Planos (Pagos)
                    </h3>
                    <div className="space-y-4">
                        {data.salesByPlan.map((plan, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div>
                                    <p className="font-bold text-sm">Valor Pago: R$ {plan.amount}</p>
                                    <p className="text-slate-500 text-xs">{plan._count.id} vendas</p>
                                </div>
                                <div className="text-right text-sm font-bold text-emerald-500">
                                    R$ {plan._sum.amount.toLocaleString('pt-BR')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClientsView({ clients, selectedClients, setSelectedClients, onNotify, onEdit, onDelete }: {
    clients: Client[],
    selectedClients: string[],
    setSelectedClients: (ids: string[]) => void,
    onNotify: () => void,
    onEdit: (client: Client) => void,
    onDelete: (id: string) => void
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
                            <th className="px-8 py-6">Data de Registro</th>
                            <th className="px-8 py-6 text-right">Ações</th>
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
                                    <td className="px-8 py-6 text-xs text-slate-400 font-mono">
                                        {new Date(client.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
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
