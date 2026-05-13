import React, { useState } from 'react';
import axios from 'axios';
import { Search, Table, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

const LegacyMapper: React.FC<{ user: any }> = ({ user }) => {
  const [inputText, setInputText] = useState('');
  const [targetTable, setTargetTable] = useState('');
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMap = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    
    // Split by comma or newline
    const columns = inputText.split(/[,\n]/).map(c => c.trim()).filter(c => c !== '');
    
    try {
      const userEmail = user?.user?.email || '';
      const response = await axios.post(`http://localhost:8000/api/tools/mapper?email=${userEmail}`, {
        columns,
        target_table: targetTable
      });
      setMappings(response.data);
    } catch (err) {
      console.error("Erro no mapeamento", err);
      alert("Falha ao mapear colunas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-slide-up space-y-10">
      <header>
        <h1 className="text-5xl font-extrabold text-slate-900 font-outfit mb-3 tracking-tight text-gradient">Mapeador Legacy</h1>
        <p className="text-slate-500 text-lg">Traduza colunas de sistemas legados para o novo padrão Databricks</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1">
        {/* Input Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="premium-card sticky top-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500 flex items-center justify-center text-white shadow-xl shadow-cyan-100">
                <Search size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none mb-1">Origem</h3>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Colunas Legacy</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tabela Alvo (Opcional)</label>
                <input 
                  type="text"
                  value={targetTable}
                  onChange={(e) => setTargetTable(e.target.value)}
                  placeholder="ex: gold.vendas.faturas"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Colunas Legacy</label>
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Cole as colunas separadas por vírgula ou quebra de linha..."
                  className="input-field h-64 text-sm font-mono resize-none py-4"
                />
              </div>

              <button 
                onClick={handleMap}
                disabled={loading || !inputText.trim()}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 btn-premium"
              >
                {loading ? <Sparkles className="animate-spin h-5 w-5" /> : <Sparkles size={20} className="text-cyan-400" />}
                {loading ? 'Mapeando...' : 'Sugerir Mapeamento'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="premium-card flex-1 flex flex-col !p-0 overflow-hidden">
            <div className="bg-slate-50/50 px-8 py-6 flex justify-between items-center border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-[0.15em] flex items-center gap-3">
                <Table size={18} className="text-cyan-500" /> Mapeamento Sugerido
              </h3>
              {mappings.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-2xl text-[10px] font-extrabold uppercase">
                  <span className="h-2 w-2 bg-cyan-500 rounded-full animate-pulse"></span>
                  {mappings.length} Colunas Detectadas
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {mappings.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white/95 backdrop-blur-xl z-10">
                    <tr className="border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coluna Legacy</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sugestão Databricks</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Confiança</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {mappings.map((m, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <span className="font-mono text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">{m.legacy}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0">
                              <ArrowRight size={14} />
                            </div>
                            <span className="font-bold text-slate-900 text-base">{m.suggested}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3 justify-center">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24 shadow-inner">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)]" 
                                style={{ width: `${m.confidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-500 min-w-[32px]">{Math.round(m.confidence * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-8 p-20 text-center">
                  <div className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 shadow-inner">
                    <Search size={80} strokeWidth={1} />
                  </div>
                  <p className="max-w-xs text-sm font-bold uppercase tracking-widest leading-relaxed">Aguardando definição das colunas de origem...</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 text-slate-400 text-[10px] uppercase tracking-widest font-bold ml-4">
            <div className="h-1 w-1 bg-cyan-400 rounded-full"></div>
            <span>Inteligência baseada no esquema atual do Catálogo Databricks Unity</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegacyMapper;
