import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, Edit2, Save, Search, Warehouse, Terminal } from 'lucide-react';

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
  const [currentSpace, setCurrentSpace] = useState<Partial<Space>>({ title: '', warehouse_id: '', description: '' });
  const [search, setSearch] = useState('');

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/genie/spaces?email=${user.user.email}`);
      setSpaces(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && currentSpace.id) {
        await axios.patch(`http://localhost:8000/api/genie/spaces/${currentSpace.id}?email=${user.user.email}`, currentSpace);
      } else {
        await axios.post(`http://localhost:8000/api/genie/spaces?email=${user.user.email}`, currentSpace);
      }
      setIsEditing(false);
      setCurrentSpace({ title: '', warehouse_id: '', description: '' });
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

  const filteredSpaces = spaces.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-extrabold text-slate-900 font-outfit mb-2">Genie Spaces</h1>
        <p className="text-slate-500">Gerencie seus ambientes inteligentes do Databricks</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <motion.div 
            className="glass card border border-slate-200 sticky top-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {isEditing ? <Edit2 className="h-5 w-5 text-orange-500" /> : <Plus className="h-5 w-5 text-orange-500" />}
              {isEditing ? 'Editar Genie Space' : 'Novo Genie Space'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Título do Space</label>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Warehouse ID (SQL)</label>
                <div className="relative">
                  <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={currentSpace.warehouse_id} 
                    onChange={e => setCurrentSpace({...currentSpace, warehouse_id: e.target.value})}
                    className="input-field pl-10"
                    placeholder="ab0de84dfac..."
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
                <textarea 
                  value={currentSpace.description} 
                  onChange={e => setCurrentSpace({...currentSpace, description: e.target.value})}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Para que serve este ambiente?"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Processando...' : <><Save className="h-4 w-4" /> Salvar</>}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={() => { setIsEditing(false); setCurrentSpace({title:'', warehouse_id:'', description:''}); }}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 transition text-sm font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>

        {/* Lista */}
        <div className="lg:col-span-2">
          <div className="glass card min-h-[600px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-xl font-bold">Ambientes Existentes</h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar spaces..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-10 py-2 text-sm"
                />
              </div>
            </div>

            {loading && spaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p>Carregando espaços...</p>
              </div>
            ) : filteredSpaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSpaces.map(space => (
                  <motion.div 
                    key={space.id} 
                    layoutId={space.id}
                    className="p-5 rounded-2xl border border-slate-100 bg-white hover:border-orange-200 hover:shadow-lg transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-orange-50 transition">
                        <Terminal className="h-5 w-5 text-slate-500 group-hover:text-orange-500" />
                      </div>
                      <button 
                        onClick={() => handleEdit(space)}
                        className="p-2 text-slate-400 hover:text-orange-500 transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">{space.title}</h3>
                    <p className="text-xs text-slate-500 font-mono mb-3">{space.warehouse_id}</p>
                    <p className="text-sm text-slate-600 line-clamp-2">{space.description || 'Sem descrição.'}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                <p>Nenhum Genie Space encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSpace;
