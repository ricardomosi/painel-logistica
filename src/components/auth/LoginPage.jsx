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
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../assets/logo';

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
      setErrorMsg(err.message || 'Erro ao autenticar. Verifique o usuário.');
      setLoading(false);
    }
  };

  const handleSelectQuickAccount = (acc, instantLogin = false) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMsg('');
    if (instantLogin) {
      handleLogin(null, acc.email, acc.pass);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#020024] via-[#091b3e] to-[#040f26] text-white relative overflow-hidden font-inter">
      
      {/* Background glow ornaments */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        
        {/* Left Column: Brand & Direct Form */}
        <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Logo className="h-10 w-auto" />
              <div>
                <h1 className="font-bold text-lg text-white leading-tight tracking-wide">
                  J PATRICIO METAIS
                </h1>
                <p className="text-xs text-cyan-400 font-medium tracking-wider uppercase">
                  Gestão Logística & Entregas
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Acesse o Sistema
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Autentique-se com sua conta de Gestor, Motorista ou Admin
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@jpatricio.com.br"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.07] border border-white/15 focus:border-cyan-400 focus:bg-white/[0.12] outline-none text-xs text-white placeholder-slate-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Senha de Acesso</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.07] border border-white/15 focus:border-cyan-400 focus:bg-white/[0.12] outline-none text-xs text-white placeholder-slate-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Supabase Auth & RBAC
            </span>
            <span>Versão 2.0 Enterprise</span>
          </div>
        </div>

        {/* Right Column: Pre-configured Accounts Selector (Instant Testing) */}
        <div className="lg:col-span-6 flex flex-col p-6 sm:p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Contas Cadastradas para Teste
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Clique no botão "Entrar" de qualquer conta para login instantâneo
              </p>
            </div>
          </div>

          {/* Subtabs for Quick Accounts */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.05] border border-white/10 mb-4">
            <button
              type="button"
              onClick={() => setActiveQuickTab('gestores')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeQuickTab === 'gestores'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gestores</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveQuickTab('motoristas')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeQuickTab === 'motoristas'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Motoristas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveQuickTab('admin')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeQuickTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Account Lists */}
          <div className="flex-1 overflow-y-auto max-h-[340px] pr-1 flex flex-col gap-2 custom-scrollbar">
            
            {/* GESTORES */}
            {activeQuickTab === 'gestores' && (
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-blue-300/80 font-bold uppercase tracking-wider px-1">
                  Responsáveis / Quem Cadastrou (5 Contas)
                </div>
                {GESTORES_CONTAS.map((gestor) => {
                  const isSelected = email === gestor.email;
                  return (
                    <div
                      key={gestor.email}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-blue-600/25 border-blue-400 shadow-md shadow-blue-500/10'
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 mr-2"
                        onClick={() => handleSelectQuickAccount(gestor, false)}
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {gestor.nome.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {gestor.nome}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {gestor.email}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectQuickAccount(gestor, true)}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1 active:scale-95 shrink-0"
                      >
                        <span>Entrar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MOTORISTAS */}
            {activeQuickTab === 'motoristas' && (
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider px-1">
                  Motoristas & Veículos Oficiais (11 Contas)
                </div>
                {MOTORISTAS_CONTAS.map((mot) => {
                  const isSelected = email === mot.email;
                  return (
                    <div
                      key={mot.email}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-emerald-600/25 border-emerald-400 shadow-md shadow-emerald-500/10'
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 mr-2"
                        onClick={() => handleSelectQuickAccount(mot, false)}
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5 truncate">
                            <span>{mot.nome}</span>
                            <span className="text-[10px] text-emerald-400 font-mono font-normal">
                              ({mot.placa})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {mot.email}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectQuickAccount(mot, true)}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-1 active:scale-95 shrink-0"
                      >
                        <span>Entrar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ADMIN */}
            {activeQuickTab === 'admin' && (
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider px-1">
                  Administração Master
                </div>
                {ADMIN_CONTAS.map((adm) => {
                  const isSelected = email === adm.email;
                  return (
                    <div
                      key={adm.email}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-amber-500/25 border-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 mr-2"
                        onClick={() => handleSelectQuickAccount(adm, false)}
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                          👑
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                            {adm.nome}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {adm.email}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectQuickAccount(adm, true)}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all flex items-center gap-1 active:scale-95 shrink-0 font-bold"
                      >
                        <span>Entrar</span>
                        <ArrowRight className="w-3 h-3" />
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
  );
}
