import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function ProtectedRoute({ allowedRoles = ['admin', 'gestor'], children }) {
  const { role, switchRole } = useAuth();
  const { setActiveTab } = useLogistics();

  const isAllowed = allowedRoles.includes(role);

  if (!isAllowed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-12 rounded-3xl glass-panel border border-rose-500/30 shadow-2xl">
        <div className="p-4 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-4 animate-bounce">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-wide">
          Acesso Restrito
        </h3>

        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          Seu perfil atual (<span className="font-bold text-cyan-400 uppercase">{role}</span>) não possui permissão para visualizar esta área confidencial.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => setActiveTab('entregas')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-btn-secondary text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Quadro</span>
          </button>

          <button
            onClick={() => switchRole('admin')}
            className="w-full px-4 py-2.5 rounded-xl glass-btn-primary text-xs font-bold"
          >
            Alternar para Admin
          </button>
        </div>
      </div>
    );
  }

  return children;
}
