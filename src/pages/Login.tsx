import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import logoImg from '@/src/assets/logo.png';

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function Login() {
  const location = useLocation();
  const { theme, toggleTheme } = useStore();
  const [mode, setMode] = useState<AuthMode>('signin');

  useEffect(() => {
    // Força o modo claro no store ao carregar a página
    if (theme === 'dark') {
      toggleTheme();
    }
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedMode = params.get('mode') as AuthMode;
    if (requestedMode && ['signin', 'signup', 'forgot'].includes(requestedMode)) {
      setMode(requestedMode);
    }
  }, [location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        setMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
        setMode('signin');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage('Instruções de recuperação enviadas para o seu e-mail.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // A classe "light" força as cores de fundo claras mesmo que o sistema mude
    <div className="light min-h-screen flex items-center justify-center p-4 bg-[#f4f4f5]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-[2.5rem] border border-[#e4e4e7] shadow-2xl space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-6">
          <img src={logoImg} alt="Pregador 360" className="h-12 w-auto mx-auto" />
          <p className="text-[#52525b] text-sm">
            {mode === 'signin' ? 'Bem-vindo de volta!' : mode === 'signup' ? 'Crie sua conta ministerial' : 'Recupere sua senha'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b] group-focus-within:text-yellow-500 transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-2xl p-4 pl-12 text-[#09090b] outline-none focus:border-yellow-500/50 transition-all"
                    placeholder="Seu nome"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b] group-focus-within:text-yellow-500 transition-colors" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-2xl p-4 pl-12 text-[#09090b] outline-none focus:border-yellow-500/50 transition-all"
                placeholder="exemplo@email.com"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-widest">Senha</label>
                {mode === 'signin' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot')}
                    className="text-[10px] font-bold text-yellow-500/70 hover:text-yellow-500 uppercase tracking-widest transition-colors"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b] group-focus-within:text-yellow-500 transition-colors" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-2xl p-4 pl-12 text-[#09090b] outline-none focus:border-yellow-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl"
            >
              {error}
            </motion.div>
          )}
          {message && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs p-4 rounded-xl"
            >
              {message}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-yellow-500 text-zinc-950 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-yellow-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Recuperar'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center pt-4">
          {mode === 'signin' ? (
            <p className="text-sm text-[#52525b]">
              Não tem uma conta?{' '}
              <button onClick={() => { setMode('signup'); setError(null); }} className="text-yellow-500 font-bold hover:underline">
                Cadastre-se
              </button>
            </p>
          ) : (
            <button onClick={() => { setMode('signin'); setError(null); }} className="text-sm text-yellow-500 font-bold hover:underline">
              Voltar para o Login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}