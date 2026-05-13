import React, { useState } from 'react';
import axios from 'axios';
import { Target, FileCode, Copy, Check, Sparkles, Code2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CrmConverter: React.FC<{ user: any }> = ({ user }) => {
  const [xml, setXml] = useState('');
  const [sql, setSql] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!xml.trim() || loading) return;
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:8000/api/tools/crm-convert?email=${user.user.email}`, { xml });
      setSql(response.data.sql);
    } catch (err) {
      console.error("Erro ao converter XML", err);
      alert("Falha ao converter XML do CRM.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full animate-slide-up space-y-10">
      <header>
        <h1 className="text-5xl font-extrabold text-slate-900 font-outfit mb-3 tracking-tight text-gradient">Conversor CRM XML</h1>
        <p className="text-slate-500 text-lg">Transforme consultas Advanced Find do CRM em statements SQL puros</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1">
        {/* XML Input */}
        <div className="flex flex-col h-full">
          <div className="premium-card flex-1 flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <Code2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none mb-1">CRM Source</h3>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">FetchXML Content</span>
              </div>
            </div>
            
            <textarea 
              value={xml}
              onChange={(e) => setXml(e.target.value)}
              placeholder="Cole o XML do FetchXML aqui..."
              className="flex-1 w-full bg-slate-50/50 border border-slate-100 rounded-[2rem] p-8 focus:ring-4 focus:ring-indigo-50 text-slate-800 font-mono text-xs resize-none custom-scrollbar outline-none transition-all"
            />
            
            <button 
              onClick={handleConvert}
              disabled={loading || !xml.trim()}
              className="mt-8 w-full py-5 bg-slate-900 text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 btn-premium"
            >
              {loading ? <Sparkles className="animate-spin h-5 w-5" /> : <Target size={20} className="text-indigo-400" />}
              {loading ? 'Convertendo Contexto...' : 'Traduzir para SQL'}
            </button>
          </div>
        </div>

        {/* SQL Output */}
        <div className="flex flex-col h-full">
          <div className="premium-card flex-1 flex flex-col overflow-hidden !p-0 bg-slate-950 border-slate-800 shadow-2xl">
            <div className="bg-slate-900/50 backdrop-blur-md px-8 py-6 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Output SQL Databricks</span>
              </div>
              {sql && (
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
              {sql ? (
                <SyntaxHighlighter 
                  language="sql" 
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '3rem', fontSize: '0.9rem', lineHeight: '1.7', height: '100%', background: 'transparent' }}
                >
                  {sql}
                </SyntaxHighlighter>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-8 p-12 text-center opacity-40">
                  <div className="p-8 rounded-[2.5rem] border border-slate-900 bg-slate-900/50">
                    <Target size={64} strokeWidth={1} />
                  </div>
                  <p className="max-w-[280px] text-sm font-bold uppercase tracking-widest leading-loose">Aguardando conversão XML...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmConverter;
