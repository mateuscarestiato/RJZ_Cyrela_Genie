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
      const res = await axios.get(`http://localhost:8000/api/genie/spaces?email=${user.user.email}`);
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
      const response = await axios.post(`http://localhost:8000/api/genie/chat?email=${user.user.email}`, {
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
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 font-outfit mb-2">Genie Chat</h1>
          <p className="text-slate-500">Pergunte qualquer coisa sobre os dados da RJZ Cyrela</p>
        </div>
        <div className="w-64">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Selecionar Ambiente</label>
          <select 
            value={selectedSpaceId}
            onChange={(e) => {
              setSelectedSpaceId(e.target.value);
              setConversationId(null);
              setMessages([]);
              sessionStorage.removeItem('conv_id');
              sessionStorage.removeItem('chat_messages');
            }}
            className="input-field py-2 text-sm bg-white cursor-pointer"
          >
            {spaces.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex-1 glass rounded-3xl p-6 overflow-hidden flex flex-col border border-slate-200">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="bg-slate-50 p-6 rounded-full">
                <MessageSquare className="h-12 w-12 text-slate-200" />
              </div>
              <p className="max-w-xs text-center">Inicie uma conversa. O Genie analisará o esquema das tabelas para você.</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
                </div>

                <div className={`max-w-[80%] space-y-4 ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-orange-50 text-slate-800 rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>

                  {msg.sql && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                      <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Database size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">SQL Indentado</span>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(msg.sql!, `sql-${idx}`)}
                          className="text-slate-400 hover:text-white transition p-1"
                        >
                          {copiedId === `sql-${idx}` ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <SyntaxHighlighter 
                        language="sql" 
                        style={vscDarkPlus}
                        customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8rem' }}
                      >
                        {msg.sql}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="mt-6 relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua pergunta aqui..."
            className="input-field pr-14 py-4 text-base shadow-lg"
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-orange-500 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;

