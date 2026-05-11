import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface LoginProps {
  onLogin: (userData: any) => void;
}

const API_URL = 'http://localhost:8000';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msEnabled, setMsEnabled] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/ms-enabled`)
      .then(res => setMsEnabled(res.data.enabled))
      .catch(() => setMsEnabled(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      if (response.data.status === 'success') {
        onLogin(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha no login. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, { email, password });
      if (response.data.status === 'success') {
        // Auto login after signup
        handleLogin(e);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao realizar cadastro.');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 bg-pan-zoom"
        style={{ 
          backgroundImage: `url('${API_URL}/assets/background_meet_cyrela_white.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0 
        }}
      ></div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px]" style={{ zIndex: 1 }}></div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[460px] px-14 py-14 rounded-[40px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col items-center"
      >
        <div className="text-center w-full" style={{ marginBottom: '30px' }}>
          <div className="flex justify-center" style={{ marginBottom: '15px' }}>
            <img 
              src={`${API_URL}/assets/logo_rjzcyrela_branco.png`}
              alt="Logo" 
              style={{ width: '180px', height: 'auto', display: 'block' }}
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight" style={{ marginBottom: '5px' }}>Genie Portal</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Data Analytics RJZ Cyrela</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-600 p-3 rounded-xl text-xs text-center border border-red-500/20 w-full" style={{ marginBottom: '15px' }}>
            {error}
          </div>
        )}

        {/* Microsoft SSO (only when configured and in login mode) */}
        {msEnabled && mode === 'login' && (
          <div className="w-full" style={{ marginBottom: '20px' }}>
            <a
              href={`${API_URL}/api/auth/microsoft/login`}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white/90 border border-white/50 text-slate-800 font-bold text-sm shadow-lg hover:bg-white hover:shadow-xl transition-all cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              <svg width="20" height="20" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              Entrar com Microsoft
            </a>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-300/50"></div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">ou</span>
              <div className="flex-1 h-px bg-slate-300/50"></div>
            </div>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="w-full">
          <div style={{ marginBottom: '20px' }}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-center" style={{ marginBottom: '6px' }}>E-mail Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-2xl py-4 pl-12 text-center text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                placeholder="seu.nome@rjzcyrela.com.br"
                required
              />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-center" style={{ marginBottom: '6px' }}>Senha</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-2xl py-4 pl-12 text-center text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base font-bold shadow-lg rounded-2xl">
            {loading ? 'Processando...' : (mode === 'login' ? 'Acessar' : 'Cadastrar')}
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-xs text-slate-600 font-bold hover:text-orange-600 transition-colors bg-transparent border-none cursor-pointer"
            >
              {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/** Callback component for Microsoft OAuth2 redirect */
export const LoginCallback: React.FC<{ onLogin: (userData: any) => void }> = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (email) {
      axios.get(`${API_URL}/api/auth/me?email=${email}`)
        .then(res => onLogin({ user: { email, name }, tokens: res.data.tokens }))
        .catch(() => onLogin({ user: { email, name }, tokens: {} }));
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, onLogin]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 font-medium">Autenticando...</p>
      </div>
    </div>
  );
};

export default Login;
