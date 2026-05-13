import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, Edit2, Save, Search, Warehouse, Terminal, Zap } from 'lucide-react';

interface Space {
  id: string;
  title: string;
  warehouse_id: string;
  description?: string;
}

const CreateSpace: React.FC<{ user: any }> = ({ user }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSpace, setCurrentSpace] = useState<Partial<Space>>({ title: '', description: '' });
  const [search, setSearch] = useState('');

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const userEmail = user?.user?.email || '';
      const res = await axios.get(`http://localhost:8000/api/genie/spaces?email=${userEmail}`);
      setSpaces(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
    const interval = setInterval(() => {
      // Usamos a função de polling de forma segura
      // Se quisermos evitar sobreposição, podemos checar o estado via Ref se necessário,
      // mas para simplificar e garantir estabilidade, vamos apenas rodar o fetch.
      fetchSpaces();
    }, 10000); // Aumentado para 10s para maior estabilidade
    return () => clearInterval(interval);
  }, []); // Dependência vazia para rodar apenas no mount

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userEmail = user?.user?.email || '';
      if (isEditing && currentSpace.id) {
        await axios.patch(`http://localhost:8000/api/genie/spaces/${currentSpace.id}?email=${userEmail}`, currentSpace);
      } else {
        await axios.post(`http://localhost:8000/api/genie/spaces?email=${userEmail}`, currentSpace);
      }
      setIsEditing(false);
      setCurrentSpace({ title: '', description: '' });
      fetchSpaces();
    } catch (err) {
      alert("Erro ao salvar o Genie Space.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (space: Space) => {
    setCurrentSpace(space);
    setIsEditing(true);
  };

  const filteredSpaces = spaces.filter(s => {
    if (!s || !s.title) return false;
    return s.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-6xl font-black text-slate-900 font-outfit mb-4 tracking-tighter leading-none">Genie Spaces</h1>
          <p className="text-slate-500 text-xl font-medium leading-relaxed">Gerencie e configure seus ambientes inteligentes do Databricks de forma centralizada.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-left md:text-right px-6 py-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status da Conexão</p>
            <p className="text-xs font-bold text-emerald-500 flex items-center gap-2 justify-start md:justify-end">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Databricks Ativo
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Formulário */}
        <div className="lg:col-span-4">
          <motion.div 
            className="premium-card sticky top-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-100">
                {isEditing ? <Edit2 size={24} /> : <Plus size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-none mb-1">
                  {isEditing ? 'Editar Space' : 'Novo Space'}
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Configuração</p>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="space-y-8">
              <div>
                <label className="label-premium">Título do Space</label>
                <input 
                  type="text" 
                  value={currentSpace.title} 
                  onChange={e => setCurrentSpace({...currentSpace, title: e.target.value})}
                  className="input-field"
                  placeholder="Ex: Vendas RJ 2024"
                  required
                />
              </div>
              <div>
                <label className="label-premium">Descrição</label>
                <textarea 
                  value={currentSpace.description} 
                  onChange={e => setCurrentSpace({...currentSpace, description: e.target.value})}
                  className="input-field min-h-[140px] resize-none py-5"
                  placeholder="Descreva o propósito deste ambiente..."
                />
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" disabled={loading} className="btn-premium bg-slate-900 text-white py-4 shadow-xl shadow-slate-200">
                  {loading ? 'Processando...' : <><Save className="h-4 w-4" /> Salvar Configuração</>}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={() => { setIsEditing(false); setCurrentSpace({title:'', description:''}); }}
                    className="py-3 text-slate-400 hover:text-slate-600 transition text-xs font-bold uppercase tracking-widest"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>

        {/* Lista */}
        <div className="lg:col-span-8">
          <div className="premium-card min-h-[600px] flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-900">Ambientes</h2>
                  <button 
                    onClick={fetchSpaces} 
                    className={`p-3 rounded-2xl bg-slate-50 hover:bg-orange-50 hover:text-orange-500 transition-all ${loading ? 'animate-spin' : ''}`}
                    title="Atualizar lista"
                  >
                    <Zap className="h-5 w-5" />
                  </button>
                </div>
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors z-10" />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nome..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-field !pl-14 py-4 bg-slate-50/50 border-transparent hover:border-slate-200 focus:bg-white"
                  />
                </div>
              </div>

            <div className="flex-1">
              {loading && spaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-6">
                  <div className="h-16 w-16 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
                  <p className="font-bold text-sm uppercase tracking-widest">Sincronizando Databricks...</p>
                </div>
              ) : filteredSpaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSpaces.map(space => (
                    <motion.div 
                      key={space.id} 
                      layoutId={space.id}
                      className="p-8 rounded-[2rem] border border-slate-100 bg-white/50 hover:bg-white hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-100/50 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(space)}
                          className="h-10 w-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mb-6 h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors shadow-inner">
                        <Terminal size={28} />
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">{space.title}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <Warehouse size={12} className="text-slate-300" />
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-tighter">{space.warehouse_id}</span>
                      </div>
                      
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                        {space.description || 'Este ambiente inteligente ainda não possui uma descrição detalhada configurada.'}
                      </p>
                      
                      <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">ID: {space.id.slice(0, 8)}...</span>
                        <div className="h-2 w-2 rounded-full bg-orange-200"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-slate-300 gap-4 opacity-50">
                  <Warehouse size={64} strokeWidth={1} />
                  <p className="font-bold text-sm uppercase tracking-widest">Nenhum ambiente encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSpace;
