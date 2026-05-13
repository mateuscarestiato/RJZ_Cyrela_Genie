import React from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  Hammer, 
  FileText, 
  Zap, 
  Search, 
  Target, 
  GitPullRequest, 
  LogOut,
  Settings as SettingsIcon
} from 'lucide-react';
import CreateSpace from './CreateSpace';
import Chat from './Chat';
import DevOpsHub from './DevOpsHub';
import DbtGenerator from './DbtGenerator';
import SqlLinter from './SqlLinter';
import LegacyMapper from './LegacyMapper';
import CrmConverter from './CrmConverter';
import DocsGenerator from './DocsGenerator';
import Settings from './Settings';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Sparkles, text: "Criar/Editar Genie Space", path: "/spaces", color: "#f0783d" },
    { icon: MessageSquare, text: "Genie Chat", path: "/chat", color: "#2563eb" },
    { icon: GitPullRequest, text: "DevOps & CI/CD Hub", path: "/devops", color: "#10b981" },
    { icon: Hammer, text: "Gerador dbt/Jinja", path: "/dbt", color: "#ec4899" },
    { icon: FileText, text: "Documentação .yml", path: "/docs", color: "#f59e0b" },
    { icon: Zap, text: "SQL Linter", path: "/linter", color: "#ef4444" },
    { icon: Search, text: "Mapeador Legacy", path: "/mapper", color: "#06b6d4" },
    { icon: Target, text: "Conversor CRM", path: "/crm", color: "#4f46e5" },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="flex flex-col items-center mb-12 px-2">
          <div className="bg-slate-900 px-6 py-4 rounded-[1.5rem] mb-4 shadow-2xl shadow-slate-200 border border-slate-800">
            <img 
              src="/assets/logo_rjzcyrela_branco.png" 
              alt="Cyrela" 
              className="h-7 w-auto object-contain"
            />
          </div>
          <h2 className="text-[10px] font-extrabold font-outfit text-slate-400 uppercase tracking-[0.2em]">Genie Developer Port</h2>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm nav-text">{item.text}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-slate-100">
          <NavLink to="/settings" className="nav-item">
            <SettingsIcon className="h-5 w-5" />
            <span className="text-sm font-semibold">Configurações</span>
          </NavLink>
          <button 
            onClick={onLogout}
            className="nav-item text-red-500 hover:text-red-600 hover:bg-red-50 w-full group"
          >
            <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-semibold">Sair do Portal</span>
          </button>
          
          <div className="mt-8 p-4 bg-slate-50/80 rounded-[1.75rem] border border-slate-100 flex items-center gap-3 shadow-inner">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-100 shrink-0">
              <span className="font-bold text-sm">{user.user.email.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-800 break-all leading-tight mb-0.5">{user.user.email}</p>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="h-1 w-1 bg-green-500 rounded-full animate-pulse"></span>
                Developer
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/spaces" />} />
            <Route path="/spaces" element={<CreateSpace user={user} />} />
            <Route path="/chat" element={<Chat user={user} />} />
            <Route path="/devops" element={<DevOpsHub user={user} />} />
            <Route path="/dbt" element={<DbtGenerator user={user} />} />
            <Route path="/docs" element={<DocsGenerator user={user} />} />
            <Route path="/linter" element={<SqlLinter user={user} />} />
            <Route path="/mapper" element={<LegacyMapper user={user} />} />
            <Route path="/crm" element={<CrmConverter user={user} />} />
            <Route path="/settings" element={<Settings user={user} />} />
            <Route path="*" element={<div className="premium-card text-center py-20 text-slate-400">Em desenvolvimento...</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
