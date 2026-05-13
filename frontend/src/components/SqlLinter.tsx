import React, { useState } from 'react';
import axios from 'axios';
import { Zap, Copy, Check, Sparkles, AlertTriangle, Info } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LintIssue {
  level: string;
  message: string;
  line: number;
}

const SqlLinter: React.FC<{ user: any }> = ({ user }) => {
  const [sql, setSql] = useState('');
  const [formatted, setFormatted] = useState('');
  const [issues, setIssues] = useState<LintIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLint = async () => {
    if (!sql.trim() || loading) return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/tools/lint', { sql });
      setFormatted(response.data.formatted);
      setIssues(response.data.issues);
    } catch (err) {
      console.error("Erro no lint", err);
      alert("Falha ao analisar SQL.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full animate-slide-up space-y-10">
      <header>
        <h1 className="text-5xl font-extrabold text-slate-900 font-outfit mb-3 tracking-tight text-gradient">SQL Linter & Formatter</h1>
        <p className="text-slate-500 text-lg">Mantenha o padrão de qualidade e indentação das suas queries Databricks</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 overflow-hidden">
        {/* Left Column: Input and Issues */}
        <div className="lg:col-span-5 flex flex-col h-full space-y-8">
          <div className="premium-card flex-1 flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-100">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-none mb-1">Input SQL</h3>
                <label className="label-premium !m-0 !mt-1">Query Original</label>
              </div>
            </div>
            
            <textarea 
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="Cole sua query aqui..."
              className="flex-1 w-full bg-slate-50/50 border border-slate-100 rounded-[1.5rem] p-6 focus:ring-4 focus:ring-red-50 text-slate-800 font-mono text-sm resize-none custom-scrollbar outline-none transition-all"
            />
            
            <button 
              onClick={handleLint}
              disabled={loading || !sql.trim()}
              className="mt-6 w-full py-4 bg-slate-900 text-white rounded-[1.15rem] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 btn-premium"
            >
              {loading ? <Sparkles className="animate-spin h-5 w-5" /> : <Zap size={18} className="text-red-400" />}
              {loading ? 'Analisando...' : 'Formatar e Analisar'}
            </button>
          </div>

          {/* Issues Panel */}
          {issues.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card !bg-red-50/50 border-red-100/50"
            >
              <h3 className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={14} /> Sugestões de Qualidade
              </h3>
              <div className="space-y-3">
                {issues.map((issue, idx) => (
                  <div key={idx} className="flex gap-4 text-sm text-slate-700 bg-white/80 p-4 rounded-2xl border border-red-100 shadow-sm animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Info size={14} className="text-red-500" />
                    </div>
                    <p className="leading-relaxed font-medium">{issue.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Formatted Result */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="premium-card flex-1 flex flex-col overflow-hidden !p-0 bg-slate-950 border-slate-800 shadow-2xl">
            <div className="bg-slate-900/50 backdrop-blur-md px-8 py-6 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SQL Formatado</span>
              </div>
              {formatted && (
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
              {formatted ? (
                <SyntaxHighlighter 
                  language="sql" 
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '3rem', fontSize: '0.9rem', lineHeight: '1.7', height: '100%', background: 'transparent' }}
                >
                  {formatted}
                </SyntaxHighlighter>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-8 p-12 text-center opacity-40">
                  <div className="p-8 rounded-[2.5rem] border border-slate-900 bg-slate-900/50">
                    <Zap size={64} strokeWidth={1} />
                  </div>
                  <p className="max-w-[280px] text-sm font-bold uppercase tracking-widest leading-loose">Aguardando análise de código...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SqlLinter;
