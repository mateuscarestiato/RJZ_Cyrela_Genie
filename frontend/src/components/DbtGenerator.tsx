import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Hammer, Copy, Check, Sparkles, FileCode, Zap } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const DbtGenerator: React.FC<{ user: any }> = ({ user }) => {
  const [sql, setSql] = useState('');
  const [alias, setAlias] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!sql.trim() || loading) return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/tools/dbt-gen', { 
        sql, 
        alias: alias || 'digite_o_alias_aqui' 
      });
      setResult(response.data.result);
    } catch (err) {
      console.error("Erro ao gerar dbt/Jinja", err);
      alert("Falha ao processar SQL. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full animate-slide-up space-y-10">
      <header>
        <h1 className="text-5xl font-extrabold text-slate-900 font-outfit mb-3 tracking-tight text-gradient">Gerador dbt/Jinja</h1>
        <p className="text-slate-500 text-lg">Converta queries SQL brutas em modelos dbt com referências dinâmicas</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1">
        {/* Input Area */}
        <div className="flex flex-col h-full">
          <div className="premium-card flex-1 flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-pink-500 flex items-center justify-center text-white shadow-xl shadow-pink-100">
                <Hammer size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none mb-1">Configuração</h3>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Input SQL & Alias</span>
              </div>
            </div>
            
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Alias da Tabela</label>
                <input 
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Ex: stg_vendas_rj"
                  className="input-field"
                />
              </div>
              
              <div className="flex-1 flex flex-col animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">SQL de Origem</label>
                <textarea 
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  placeholder="Cole aqui o seu SQL (ex: SELECT * FROM catalog.semantic.table)..."
                  className="flex-1 w-full bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 focus:ring-4 focus:ring-pink-50 text-slate-800 font-mono text-sm resize-none custom-scrollbar outline-none transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading || !sql.trim()}
              className="mt-8 w-full py-5 bg-slate-900 text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 btn-premium"
            >
              {loading ? <Sparkles className="animate-spin h-5 w-5" /> : <Zap size={20} className="text-pink-400" />}
              {loading ? 'Processando dbt...' : 'Gerar Jinja SQL'}
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="flex flex-col h-full">
          <div className="premium-card flex-1 flex flex-col overflow-hidden !p-0 bg-slate-950 border-slate-800">
            <div className="bg-slate-900/50 backdrop-blur-md px-8 py-6 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 bg-pink-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resultado dbt (Jinja)</span>
              </div>
              {result && (
                <button 
                  onClick={copyToClipboard}
                  className="text-slate-400 hover:text-white transition-all flex items-center gap-2 group px-4 py-2 bg-slate-800 rounded-xl border border-slate-700"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  <span className="text-[10px] font-bold uppercase tracking-widest">{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              {result ? (
                <SyntaxHighlighter 
                  language="sql" 
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '2.5rem', fontSize: '0.9rem', lineHeight: '1.7', height: '100%', background: 'transparent' }}
                >
                  {result}
                </SyntaxHighlighter>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-6 p-10 text-center opacity-40">
                  <FileCode size={80} strokeWidth={1} />
                  <p className="max-w-[240px] text-sm font-bold uppercase tracking-widest">Aguardando Input...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DbtGenerator;
