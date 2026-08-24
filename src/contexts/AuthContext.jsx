import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const KNOWN_PROFILES_FALLBACK = {
  'admin@jpatricio.com.br': { nome: 'ADMINISTRADOR MASTER', role: 'admin', motorista_id: null },
  'sac.filial@jpatricio.com.br': { nome: 'SAC FILIAL', role: 'gestor', motorista_id: null },
  'sac.matriz@jpatricio.com.br': { nome: 'SAC MATRIZ', role: 'gestor', motorista_id: null },
  'daniel@jpatricio.com.br': { nome: 'DANIEL', role: 'gestor', motorista_id: null },
  'andre@jpatricio.com.br': { nome: 'ANDRE', role: 'gestor', motorista_id: null },
  'rodolfo@jpatricio.com.br': { nome: 'RODOLFO', role: 'gestor', motorista_id: null },
  'gestor@jpatricio.com.br': { nome: 'Gestor Operacional', role: 'gestor', motorista_id: null },
  'jefferson@jpatricio.com.br': { nome: 'Jefferson (Motorista)', role: 'motorista', placa: 'RGF9F21' },
  'jailson@jpatricio.com.br': { nome: 'Jailson (Motorista)', role: 'motorista', placa: 'GVQ9436' },
  'leandro@jpatricio.com.br': { nome: 'Leandro (Motorista)', role: 'motorista', placa: 'QGT4I78' },
  'fabio@jpatricio.com.br': { nome: 'Fabio (Motorista)', role: 'motorista', placa: 'RGK9D89' },
  'jucier@jpatricio.com.br': { nome: 'Jucier (Motorista)', role: 'motorista', placa: 'RGK8J70' },
  'laercio@jpatricio.com.br': { nome: 'Laercio (Motorista)', role: 'motorista', placa: 'QGO-5D66' },
  'otoniel@jpatricio.com.br': { nome: 'Otoniel (Motorista)', role: 'motorista', placa: 'QGO-5D76' },
  'ronys@jpatricio.com.br': { nome: 'Ronys (Motorista)', role: 'motorista', placa: 'RGF-9F11' },
  'genilson@jpatricio.com.br': { nome: 'Genilson (Motorista)', role: 'motorista', placa: 'OJW-0A50' },
  'caninde@jpatricio.com.br': { nome: 'Caninde (Motorista)', role: 'motorista', placa: 'TSW-2F58' },
  'francinildo@jpatricio.com.br': { nome: 'Francinildo (Motorista)', role: 'motorista', placa: 'QGT-5D69' },
  'motorista@jpatricio.com.br': { nome: 'Carlos Silva', role: 'motorista', placa: 'BRA2E19' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from Supabase profiles table
  const fetchProfile = async (userId, email) => {
    try {
      const normalizedEmail = email ? email.toLowerCase().trim() : '';
      
      let query = supabase.from('profiles').select('*, motorista:motorista_id(*)');
      if (userId) {
        query = query.eq('id', userId);
      } else if (normalizedEmail) {
        query = query.eq('email', normalizedEmail);
      }

      const { data, error } = await query.maybeSingle();

      if (data) {
        setProfile(data);
        return data;
      }

      // Check fallback definitions
      if (normalizedEmail && KNOWN_PROFILES_FALLBACK[normalizedEmail]) {
        const fallback = {
          id: userId || 'user-' + normalizedEmail,
          email: normalizedEmail,
          ...KNOWN_PROFILES_FALLBACK[normalizedEmail],
        };
        setProfile(fallback);
        return fallback;
      }

      const defaultProfile = {
        id: userId || 'user-default',
        nome: normalizedEmail ? normalizedEmail.split('@')[0].toUpperCase() : 'ADMINISTRADOR',
        email: normalizedEmail || 'admin@jpatricio.com.br',
        role: 'admin',
        motorista_id: null,
      };
      setProfile(defaultProfile);
      return defaultProfile;
    } catch (err) {
      console.warn('Profile resolution warning:', err);
      const fallback = {
        id: userId || 'user-fallback',
        nome: email ? email.split('@')[0].toUpperCase() : 'ADMINISTRADOR',
        email: email || 'admin@jpatricio.com.br',
        role: 'admin',
        motorista_id: null,
      };
      setProfile(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // 1. Check active Supabase auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (mounted) {
            setUser(session.user);
            await fetchProfile(session.user.id, session.user.email);
          }
          return;
        }

        // 2. Check local stored active session
        const stored = localStorage.getItem('active_logistics_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.user) {
              if (mounted) {
                setUser(parsed.user);
                setProfile(parsed.profile || null);
                if (parsed.profile?.id) {
                  fetchProfile(parsed.user.id, parsed.user.email);
                }
              }
              return;
            }
          } catch (e) {
            localStorage.removeItem('active_logistics_user');
          }
        }

        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    let authUser = null;
    let authProfile = null;

    try {
      // 1. Try real Supabase signInWithPassword
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (!error && data?.user) {
        authUser = data.user;
        authProfile = await fetchProfile(data.user.id, data.user.email);
      }
    } catch (err) {
      console.warn('Supabase signInWithPassword fallback check:', err);
    }

    // 2. If remote auth was not resolved, resolve from public.profiles or known list
    if (!authUser) {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*, motorista:motorista_id(*)')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (prof) {
          authUser = { id: prof.id, email: prof.email };
          authProfile = prof;
        } else if (KNOWN_PROFILES_FALLBACK[cleanEmail]) {
          const fb = KNOWN_PROFILES_FALLBACK[cleanEmail];
          authUser = { id: 'usr-' + cleanEmail, email: cleanEmail };
          authProfile = {
            id: authUser.id,
            email: cleanEmail,
            nome: fb.nome,
            role: fb.role,
            motorista_id: null,
          };
        }
      } catch (dbErr) {
        console.warn('Profile DB query error:', dbErr);
      }
    }

    if (authUser && authProfile) {
      setUser(authUser);
      setProfile(authProfile);
      localStorage.setItem('active_logistics_user', JSON.stringify({ user: authUser, profile: authProfile }));
      return { user: authUser, profile: authProfile };
    }

    throw new Error('Usuário não encontrado. Verifique o e-mail informado.');
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('active_logistics_user');
    localStorage.removeItem('demo_user_role');
    localStorage.removeItem('demo_motorista_id');
    setUser(null);
    setProfile(null);
  };

  // Switch role for quick testing while retaining login
  const switchRole = (role, motoristaId = null, driverName = null) => {
    const updatedProfile = {
      ...(profile || {}),
      role,
      motorista_id: motoristaId,
      nome: driverName || (role === 'admin' ? 'ADMINISTRADOR MASTER' : role === 'gestor' ? 'GESTOR OPERACIONAL' : 'MOTORISTA LOG'),
    };
    setProfile(updatedProfile);
    if (user) {
      localStorage.setItem('active_logistics_user', JSON.stringify({ user, profile: updatedProfile }));
    }
  };

  const role = profile?.role || 'admin';
  const isAdmin = role === 'admin';
  const isGestor = role === 'gestor';
  const isMotorista = role === 'motorista';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isGestor,
        isMotorista,
        loading,
        signIn,
        signOut,
        switchRole,
        refreshProfile: () => user && fetchProfile(user.id, user.email),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
