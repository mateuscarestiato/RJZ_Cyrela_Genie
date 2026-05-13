import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, GitPullRequest, User, Save, Check, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'databricks' | 'devops'>('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full animate-slide-up space-y-10">
      <header>
        <h1 className="text-5xl font-extrabold text-slate-900 font-outfit mb-3 tracking-tight text-gradient">Configurações</h1>
        <p className="text-slate-500 text-lg">Gerencie suas credenciais e preferências do portal</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <User size={18} /> Perfil do Usuário
          </button>
          <button 
            onClick={() => setActiveTab('databricks')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'databricks' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Database size={18} /> Databricks Unity
          </button>
          <button 
            onClick={() => setActiveTab('devops')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'devops' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <GitPullRequest size={18} /> Azure DevOps
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <div className="premium-card h-full flex flex-col">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-16 w-16 rounded-3xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Informações Pessoais</h3>
                    <p className="text-sm text-slate-400 font-medium">Seus dados de identificação no Genie</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                    <input type="text" value={user.user.email} disabled className="input-field bg-slate-50 opacity-70 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Nome de Exibição</label>
                    <input type="text" placeholder="Ex: Mateus Carestiato" className="input-field" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'databricks' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-16 w-16 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                    <Database size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Catálogo Databricks</h3>
                    <p className="text-sm text-slate-400 font-medium">Conectividade com o Unity Catalog</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Databricks Host</label>
                    <input type="text" placeholder="https://adb-xxxx.azuredatabricks.net" className="input-field font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Personal Access Token (PAT)</label>
                    <input type="password" placeholder="dapi****************" className="input-field font-mono text-sm" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'devops' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-16 w-16 rounded-3xl bg-green-100 flex items-center justify-center text-green-600 shadow-inner">
                    <GitPullRequest size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Integração Azure</h3>
                    <p className="text-sm text-slate-400 font-medium">Automação de Git e Pull Requests</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">ADO Organization</label>
                    <input type="text" placeholder="cyrela-rjz" className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">ADO Project</label>
                    <input type="text" placeholder="Genie_Data" className="input-field" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">ADO Repository</label>
                  <input type="text" placeholder="dbt_cyrela" className="input-field" />
                </div>
              </motion.div>
            )}

            <div className="mt-auto pt-10 flex justify-between items-center border-t border-slate-50">
              <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition font-bold text-xs uppercase tracking-widest">
                <RefreshCw size={14} /> Redefinir para Padrão
              </button>
              <button 
                onClick={handleSave}
                className="btn-premium bg-slate-900 text-white px-10 py-4 shadow-xl shadow-slate-200"
              >
                {saved ? <Check size={20} className="text-green-400" /> : <Save size={20} className="text-orange-400" />}
                {saved ? 'Configurações Salvas!' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
