import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Sparkles, Database, Copy, Check, MessageSquare } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  sql?: string;
  datasets?: any[];
}

interface Space {
  id: string;
  title: string;
}

const Chat: React.FC<{ user: any }> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() => sessionStorage.getItem('conv_id'));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(() => sessionStorage.getItem('selected_space_id') || '');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchSpaces = async () => {
    try {
      const userEmail = user?.user?.email || '';
      const res = await axios.get(`http://localhost:8000/api/genie/spaces?email=${userEmail}`);
      setSpaces(res.data);
      if (!selectedSpaceId && res.data.length > 0) {
        setSelectedSpaceId(res.data[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar spaces no chat", err);
    }
  };

  useEffect(() => {
    fetchSpaces();
    const interval = setInterval(fetchSpaces, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    sessionStorage.setItem('chat_messages', JSON.stringify(messages));
    if (conversationId) sessionStorage.setItem('conv_id', conversationId);
    if (selectedSpaceId) sessionStorage.setItem('selected_space_id', selectedSpaceId);
  }, [messages, conversationId, selectedSpaceId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const userEmail = user?.user?.email || '';
      const response = await axios.post(`http://localhost:8000/api/genie/chat?email=${userEmail}`, {
        content: input,
        conversation_id: conversationId,
        space_id: selectedSpaceId
      });

      const { conversation_id, message } = response.data;
      setConversationId(conversation_id);

      // Process attachments for SQL
      let sql = '';
      const attachments = message.attachments || [];
      const sqlAtt = attachments.find((a: any) => a.query?.query);
      if (sqlAtt) sql = sqlAtt.query.query;

      const assistantMsg: Message = {
        role: 'assistant',
        text: message.text?.plain_text || 'Resposta processada.',
        sql: sql
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Erro ao processar sua pergunta. Verifique a conexão com o Databricks.' }]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-slide-up space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-extrabold text-slate-900 font-outfit mb-2 tracking-tight text-gradient">Genie Chat</h1>
          <p className="text-slate-500 text-lg">Pergunte qualquer coisa sobre os dados da RJZ Cyrela</p>
        </div>
        <div className="w-80">
          <label className="label-premium">Ambiente de Dados</label>
          <div className="relative">
            <select 
              value={selectedSpaceId}
              onChange={(e) => {
                setSelectedSpaceId(e.target.value);
                setConversationId(null);
                setMessages([]);
                sessionStorage.removeItem('conv_id');
                sessionStorage.removeItem('chat_messages');
              }}
              className="input-field py-3.5 text-sm bg-white border-slate-200 shadow-sm appearance-none cursor-pointer"
            >
              {spaces.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Database size={16} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 premium-card flex flex-col !p-0 overflow-hidden relative border-none shadow-2xl">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 p-10 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-8 opacity-50">
              <div className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 shadow-inner">
                <MessageSquare size={80} strokeWidth={1} />
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-sm uppercase tracking-widest">Inicie uma análise inteligente</p>
                <p className="text-xs max-w-xs leading-relaxed">O Genie analisará o catálogo do Unity Catalog para responder suas perguntas de negócio.</p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  msg.role === 'user' ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-100'
                }`}>
                  {msg.role === 'user' ? <User size={24} /> : <Sparkles size={24} />}
                </div>

                <div className={`max-w-[75%] space-y-6 ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-6 rounded-[2rem] text-base leading-relaxed shadow-sm ${
                    msg.role === 'user' ? 'bg-orange-50 text-slate-800 rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>

                  {msg.sql && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl bg-slate-950"
                    >
                      <div className="bg-slate-900/50 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Query SQL Sugerida</span>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(msg.sql!, `sql-${idx}`)}
                          className="text-slate-400 hover:text-white transition-all flex items-center gap-2 group px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700"
                        >
                          {copiedId === `sql-${idx}` ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          <span className="text-[9px] font-bold uppercase tracking-widest">{copiedId === `sql-${idx}` ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                      <SyntaxHighlighter 
                        language="sql" 
                        style={vscDarkPlus}
                        customStyle={{ margin: 0, padding: '2.5rem', fontSize: '0.85rem', lineHeight: '1.7', background: 'transparent' }}
                      >
                        {msg.sql}
                      </SyntaxHighlighter>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <div className="flex gap-6">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div className="bg-white border border-slate-100 p-6 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-white border-t border-slate-50">
          <form onSubmit={handleSend} className="relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descreva sua análise de dados aqui..."
              className="input-field pr-20 py-5 text-lg shadow-2xl shadow-slate-100 border-slate-100 group-focus-within:border-orange-200"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-14 w-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 btn-premium"
            >
              <Send size={24} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;

