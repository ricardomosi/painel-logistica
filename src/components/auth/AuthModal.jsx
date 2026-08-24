import React, { useState } from 'react';
import { Lock, Mail, UserCheck, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../assets/logo';

export default function AuthModal({ isOpen, onClose }) {
  const { signIn, switchRole, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await signIn(email, password);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl glass-panel border border-cyan-500/30 shadow-2xl flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <Logo className="h-10" />
          <h3 className="mt-4 text-lg font-bold text-white tracking-wide">
            Acesso ao Painel Logístico
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Entre com suas credenciais do Supabase
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@jpatricio.com.br"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 rounded-xl glass-btn-primary text-xs font-bold"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        {/* Contas de Teste Pré-configuradas */}
        <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider text-center">
            Preencher Contas de Teste (Supabase)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@jpatricio.com.br');
                setPassword('admin123456');
              }}
              className="px-2 py-2 rounded-xl text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all text-center flex flex-col items-center gap-0.5"
            >
              <span>👑 Admin</span>
              <span className="text-[9px] text-amber-400/80 font-normal">admin123456</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('gestor@jpatricio.com.br');
                setPassword('gestor123456');
              }}
              className="px-2 py-2 rounded-xl text-[11px] font-bold bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition-all text-center flex flex-col items-center gap-0.5"
            >
              <span>📋 Gestor</span>
              <span className="text-[9px] text-blue-400/80 font-normal">gestor123456</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('motorista@jpatricio.com.br');
                setPassword('motorista123456');
              }}
              className="px-2 py-2 rounded-xl text-[11px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all text-center flex flex-col items-center gap-0.5"
            >
              <span>🚚 Motorista</span>
              <span className="text-[9px] text-emerald-400/80 font-normal">motorista123456</span>
            </button>
          </div>
        </div>

        {/* Demo Fast Switch */}
        <div className="pt-2 border-t border-white/10 text-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Modo Rápido Offline (Sem Autenticar)
          </span>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => { switchRole('admin'); onClose(); }}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
            >
              Simular Admin
            </button>
            <button
              type="button"
              onClick={() => { switchRole('gestor'); onClose(); }}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
            >
              Simular Gestor
            </button>
            <button
              type="button"
              onClick={() => { switchRole('motorista'); onClose(); }}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
            >
              Simular Motorista
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
