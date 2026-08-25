import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  UserCheck, 
  Truck, 
  ShieldCheck, 
  LogIn, 
  ArrowRight, 
  Eye, 
  EyeOff,
  Sparkles,
  Users,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LOGO_LOGIN } from '../../assets/logo';

const GESTORES_CONTAS = [
  { nome: 'SAC FILIAL', email: 'sac.filial@jpatricio.com.br', pass: 'gestor123456', role: 'Gestor' },
  { nome: 'SAC MATRIZ', email: 'sac.matriz@jpatricio.com.br', pass: 'gestor123456', role: 'Gestor' },
  { nome: 'DANIEL', email: 'daniel@jpatricio.com.br', pass: 'gestor123456', role: 'Gestor' },
  { nome: 'ANDRE', email: 'andre@jpatricio.com.br', pass: 'gestor123456', role: 'Gestor' },
  { nome: 'RODOLFO', email: 'rodolfo@jpatricio.com.br', pass: 'gestor123456', role: 'Gestor' },
];

const ADMIN_CONTAS = [
  { nome: 'ADMINISTRADOR MASTER', email: 'admin@jpatricio.com.br', pass: 'admin123456', role: 'Admin' },
];

const MOTORISTAS_CONTAS = [
  { nome: 'Jefferson', placa: 'RGF9F21', email: 'jefferson@jpatricio.com.br', pass: 'motorista123456' },
  { nome: 'Jailson', placa: 'GVQ9436', email: 'jailson@jpatricio.com.br', pass: 'motorista123456' },
  { nome: 'Leandro', placa: 'QGT4I78', email: 'leandro@jpatricio.com.br', pass: 'motorista123456' },
  { nome: 'Fabio', placa: 'RGK9D89', email: 'fabio@jpatricio.com.br', pass: 'motorista123456' },
  { nome: 'Jucier', placa: 'RGK8J70', email: 'jucier@jpatricio.com.br', pass: 'motorista123456' },
  { nome: 'Laercio', placa: 'QGO-5D66', email: 'laercio@jpatricio.com.br', pass: 'motorista123456' },
  { nome: 'Otoniel', placa: 'QGO-5D76', email: 'otoniel@jpatricio.com.br', pass: 'motorista123456' },
  { nome: 'Ronys', placa: 'RGF-9F11', email: 'ronys@jpatricio.com.br', pass: 'motorista123456' },
  { nome: 'Genilson', placa: 'OJW-0A50', email: 'genilson@jpatricio.com.br', pass: 'motorista123456' },
  { nome: 'Caninde', placa: 'TSW-2F58', email: 'caninde@jpatricio.com.br', pass: 'motorista123456' },
  { nome: 'Francinildo', placa: 'QGT-5D69', email: 'francinildo@jpatricio.com.br', pass: 'motorista123456' },
];

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('admin@jpatricio.com.br');
  const [password, setPassword] = useState('admin123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeQuickTab, setActiveQuickTab] = useState('gestores'); // 'gestores' | 'motoristas' | 'admin'
  const [mobileView, setMobileView] = useState('form'); // 'form' | 'quick' for mobile toggle

  const handleLogin = async (e, customEmail = null, customPass = null) => {
    if (e) e.preventDefault();
    const loginEmail = (customEmail || email || '').trim();
    const loginPass = customPass || password;

    if (!loginEmail) {
      setErrorMsg('Informe o e-mail para acesso.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await signIn(loginEmail, loginPass);
    } catch (err) {
      console.error('Erro de login:', err);
      setErrorMsg(err.message || 'Erro ao autenticar. Verifique as credenciais.');
      setLoading(false);
    }
  };

  const handleSelectQuickAccount = (acc, instantLogin = false) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMsg('');
    if (instantLogin) {
      handleLogin(null, acc.email, acc.pass);
    } else {
      setMobileView('form');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 bg-gradient-to-br from-[#020024] via-[#091b3e] to-[#040f26] text-white relative overflow-x-hidden font-inter">
      
      {/* Background glow ornaments */}
      <div className="absolute -top-40 -left-40 w-80 sm:w-96 h-80 sm:h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-4xl flex flex-col gap-4 z-10 my-auto">
        
        {/* Mobile View Switcher (Visible only on screens < lg) */}
        <div className="flex lg:hidden bg-slate-900/90 p-1 rounded-2xl border border-white/20 w-full shadow-lg">
          <button
            type="button"
            onClick={() => setMobileView('form')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              mobileView === 'form'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Login com Senha</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileView('quick')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              mobileView === 'quick'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Contas de Teste (1-Clique)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          
          {/* Left Column: Brand & Direct Form */}
          <div className={`lg:col-span-6 flex flex-col justify-between p-5 sm:p-8 rounded-3xl bg-white/[0.05] backdrop-blur-2xl border border-white/20 shadow-2xl ${
            mobileView === 'quick' ? 'hidden lg:flex' : 'flex'
          }`}>
            <div>
              {/* Header Brand with 100% Transparent Logo */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 mb-5 pb-4 border-b border-white/15">
                <img 
                  src={LOGO_LOGIN} 
                  alt="J Patricio Metais" 
                  className="h-16 sm:h-20 w-auto object-contain bg-transparent drop-shadow-lg" 
                />
                <div className="flex flex-col justify-center">
                  <h1 className="font-extrabold text-base sm:text-lg text-white leading-tight tracking-wide">
                    J PATRICIO METAIS
                  </h1>
                  <p className="text-xs text-cyan-300 font-bold tracking-wider uppercase mt-0.5">
                    Logística & Distribuição
                  </p>
                </div>
              </div>

              <div className="mb-5 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Acesse o Sistema
                </h2>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  Autentique-se com sua conta de Gestor, Motorista ou Admin
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-200 font-semibold">
                  <span className="material-symbols-outlined text-base mt-0.5 shrink-0 text-rose-300">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-3.5 sm:gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                    <input
                      type="email"
                      required
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
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white p-1"
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
                      <span>Entrando no Sistema...</span>
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
            </div>

            <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Supabase Auth & RBAC
              </span>
              <span className="text-slate-400 font-mono text-[11px]">v2.0 Enterprise</span>
            </div>
          </div>

          {/* Right Column: Pre-configured Accounts Selector (Instant Testing) */}
          <div className={`lg:col-span-6 flex flex-col p-5 sm:p-8 rounded-3xl bg-slate-950/85 backdrop-blur-2xl border border-white/20 shadow-2xl ${
            mobileView === 'form' ? 'hidden lg:flex' : 'flex'
          }`}>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Contas Oficiais para Teste
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Clique no botão "Entrar" para login imediato com o perfil
                </p>
              </div>
            </div>

            {/* Subtabs for Quick Accounts */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.08] border border-white/15 mb-3.5">
              <button
                type="button"
                onClick={() => setActiveQuickTab('gestores')}
                className={`py-2 px-1 sm:px-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                  activeQuickTab === 'gestores'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Gestores</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveQuickTab('motoristas')}
                className={`py-2 px-1 sm:px-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                  activeQuickTab === 'motoristas'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Motoristas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveQuickTab('admin')}
                className={`py-2 px-1 sm:px-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                  activeQuickTab === 'admin'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Account Lists */}
            <div className="flex-1 overflow-y-auto max-h-[360px] sm:max-h-[330px] pr-1 flex flex-col gap-2.5 custom-scrollbar">
              
              {/* GESTORES */}
              {activeQuickTab === 'gestores' && (
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] text-cyan-300 font-extrabold uppercase tracking-wider px-1">
                    Responsáveis / Quem Cadastrou (5 Contas)
                  </div>
                  {GESTORES_CONTAS.map((gestor) => {
                    const isSelected = email === gestor.email;
                    return (
                      <div
                        key={gestor.email}
                        className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-blue-600/30 border-blue-400 shadow-md'
                            : 'bg-white/[0.04] border-white/15 hover:bg-white/[0.09] hover:border-white/25'
                        }`}
                      >
                        <div 
                          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer flex-1 min-w-0 mr-2"
                          onClick={() => handleSelectQuickAccount(gestor, false)}
                        >
                          <div className="w-8 h-8 rounded-xl bg-blue-500/25 text-cyan-300 border border-blue-400/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {gestor.nome.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                              {gestor.nome}
                            </div>
                            <div className="text-[11px] text-slate-300 font-mono truncate">
                              {gestor.email}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectQuickAccount(gestor, true)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1 active:scale-95 shrink-0"
                        >
                          <span>Entrar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MOTORISTAS */}
              {activeQuickTab === 'motoristas' && (
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wider px-1">
                    Motoristas & Veículos Oficiais (11 Contas)
                  </div>
                  {MOTORISTAS_CONTAS.map((mot) => {
                    const isSelected = email === mot.email;
                    return (
                      <div
                        key={mot.email}
                        className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-emerald-600/30 border-emerald-400 shadow-md'
                            : 'bg-white/[0.04] border-white/15 hover:bg-white/[0.09] hover:border-white/25'
                        }`}
                      >
                        <div 
                          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer flex-1 min-w-0 mr-2"
                          onClick={() => handleSelectQuickAccount(mot, false)}
                        >
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5 truncate">
                              <span>{mot.nome}</span>
                              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                ({mot.placa})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300 font-mono truncate">
                              {mot.email}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectQuickAccount(mot, true)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-1 active:scale-95 shrink-0"
                        >
                          <span>Entrar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ADMIN */}
              {activeQuickTab === 'admin' && (
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider px-1">
                    Administração Master
                  </div>
                  {ADMIN_CONTAS.map((adm) => {
                    const isSelected = email === adm.email;
                    return (
                      <div
                        key={adm.email}
                        className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-amber-500/30 border-amber-400 shadow-md'
                            : 'bg-white/[0.04] border-white/15 hover:bg-white/[0.09] hover:border-white/25'
                        }`}
                      >
                        <div 
                          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer flex-1 min-w-0 mr-2"
                          onClick={() => handleSelectQuickAccount(adm, false)}
                        >
                          <div className="w-8 h-8 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-xs shrink-0">
                            👑
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                              {adm.nome}
                            </div>
                            <div className="text-[11px] text-slate-300 font-mono truncate">
                              {adm.email}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectQuickAccount(adm, true)}
                          className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition-all flex items-center gap-1 active:scale-95 shrink-0"
                        >
                          <span>Entrar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
