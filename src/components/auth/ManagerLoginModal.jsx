import React, { useState } from 'react';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function ManagerLoginModal() {
  const { 
    managerModalOpen, 
    setManagerModalOpen, 
    authenticateManager 
  } = useLogistics();

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!managerModalOpen) return null;

  const handleAuth = (e) => {
    e?.preventDefault();
    const success = authenticateManager(pin);
    if (!success) {
      setError(true);
    } else {
      setError(false);
      setPin('');
    }
  };

  const handleClose = () => {
    setManagerModalOpen(false);
    setError(false);
    setPin('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[80] transition-opacity p-4 font-inter animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto p-6 transform transition-all scale-100 font-inter">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">lock</span>
            Acesso Gerencial
          </h3>
          <button 
            type="button"
            onClick={handleClose} 
            className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Chave de Acesso</label>
            <input 
              type="password" 
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="Digite a chave..." 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest text-lg font-bold" 
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-semibold text-center">
              Chave incorreta! Tente novamente.
            </p>
          )}

          <button 
            type="submit" 
            className="w-full px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm active:scale-95"
          >
            Liberar Acesso
          </button>
        </form>

      </div>
    </div>
  );
}
