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
  Settings
} from 'lucide-react';
import CreateSpace from './CreateSpace';
import Chat from './Chat';
import DevOpsHub from './DevOpsHub';

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
      <aside className="sidebar glass border-r border-slate-200">
        <div className="flex flex-col items-center mb-14 px-4">
          <img 
            src="http://localhost:8000/assets/logo_rjzcyrela_branco.png" 
            alt="Cyrela" 
            className="h-10 w-auto mb-2 object-contain"
          />
          <h2 className="text-sm font-bold font-outfit text-slate-400 uppercase tracking-widest">Genie Port</h2>
        </div>

        <nav className="flex-1 space-y-5">
          {menuItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200
                ${isActive ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
              `}
            >
              <item.icon className="h-5 w-5" style={{ color: item.color }} />
              <span className="font-medium text-sm nav-text">{item.text}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
          <NavLink to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition">
            <Settings className="h-5 w-5" />
            <span className="font-medium text-sm">Configurações</span>
          </NavLink>
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-sm">Sair</span>
          </button>
          
          <div className="mt-4 px-4 py-3 bg-slate-50 rounded-2xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
              {user.user.email.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">{user.user.email}</p>
              <p className="text-[10px] text-slate-500">Desenvolvedor</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/spaces" />} />
          <Route path="/spaces" element={<CreateSpace user={user} />} />
          <Route path="/chat" element={<Chat user={user} />} />
          <Route path="/devops" element={<DevOpsHub user={user} />} />
          <Route path="/settings" element={<div>Settings Component</div>} />
          <Route path="*" element={<div className="glass p-10 rounded-3xl text-center">Em desenvolvimento...</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
