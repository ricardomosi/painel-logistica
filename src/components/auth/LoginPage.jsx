import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  LogIn, 
  ArrowRight, 
  Eye, 
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LOGO_LOGIN } from '../../assets/logo';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const loginEmail = (email || '').trim();
    const loginPass = password;

    if (!loginEmail) {
      setErrorMsg('Informe o e-mail corporativo para acesso.');
      return;
    }

    if (!loginPass) {
      setErrorMsg('Informe sua senha de acesso.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await signIn(loginEmail, loginPass);
    } catch (err) {
      console.error('Erro de login:', err);
      setErrorMsg(err.message || 'Erro ao autenticar. Verifique o e-mail e a senha digitados.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#020024] via-[#091b3e] to-[#040f26] text-white relative overflow-x-hidden font-inter">
      
      {/* Background subtle glow ornaments */}
      <div className="absolute -top-40 -left-40 w-80 sm:w-96 h-80 sm:h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md flex flex-col gap-4 z-10 my-auto">
        
        {/* Main Login Card */}
        <div className="flex flex-col p-6 sm:p-8 rounded-2xl bg-white/[0.06] backdrop-blur-2xl border border-white/20 shadow-2xl">
          
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center gap-3 mb-6 pb-5 border-b border-white/15">
            <img 
              src={LOGO_LOGIN} 
              alt="J Patricio Metais" 
              className="h-16 sm:h-20 w-auto object-contain bg-transparent drop-shadow-lg" 
            />
            <div className="flex flex-col items-center">
              <h1 className="font-extrabold text-lg sm:text-xl text-white leading-tight tracking-wide">
                J PATRICIO METAIS
              </h1>
              <p className="text-xs text-cyan-300 font-bold tracking-wider uppercase mt-1">
                Logística & Distribuição
              </p>
            </div>
          </div>

          <div className="mb-5 text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Acesso ao Sistema
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Informe suas credenciais para entrar no painel
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-200 font-semibold">
              <span className="material-symbols-outlined text-base mt-0.5 shrink-0 text-rose-300">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-200">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@jpatricio.com.br"
                  className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-xl bg-slate-950/70 border border-white/25 focus:border-cyan-400 focus:bg-slate-900 outline-none text-xs sm:text-sm text-white placeholder-slate-400 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">Senha de Acesso</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 sm:py-3.5 rounded-xl bg-slate-950/70 border border-white/25 focus:border-cyan-400 focus:bg-slate-900 outline-none text-xs sm:text-sm text-white placeholder-slate-400 transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 sm:py-4 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Acesso Seguro
            </span>
            <span className="text-slate-400 font-mono text-[11px]">v2.0 Oficial</span>
          </div>

        </div>

      </div>
    </div>
  );
}
