import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, UsuarioApp } from "../services/authService";
import { registerForPushNotificationsAsync } from "../services/pushNotificationService";

interface AuthContextData {
  usuario: UsuarioApp | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (email: string, senha: string, nome: string, telefone: string, apartamentoId: string, bloco: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioApp | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const session = await authService.checkSession();
        if (session) {
          if (!session.user.role || (session.user.role !== "ADMIN" && session.user.role !== "MORADOR")) {
            // Se o usuário não tem role ou a role é antiga (super_admin, porteiro), força logout
            await authService.logout();
            setUsuario(null);
          } else {
            setUsuario(session.user);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar sessão persistida:", err);
      } finally {
        setCarregando(false);
      }
    }
    loadSession();
  }, []);

  useEffect(() => {
    async function setupPushNotifications() {
      if (usuario) {
        const token = await registerForPushNotificationsAsync();
        if (token && token !== usuario.expoPushToken) {
          await authService.updatePushToken(usuario.uid, token);
          setUsuario(prev => prev ? { ...prev, expoPushToken: token } : null);
        }
      }
    }
    setupPushNotifications();
  }, [usuario?.uid]); // Executa apenas quando o uid do usuário muda ou é setado

  async function login(email: string, senha: string) {
    setCarregando(true);
    try {
      const user = await authService.login(email, senha);
      setUsuario(user);
    } finally {
      setCarregando(false);
    }
  }

  async function register(email: string, senha: string, nome: string, telefone: string, apartamentoId: string, bloco: string) {
    setCarregando(true);
    try {
      const user = await authService.register(email, senha, nome, telefone, apartamentoId, bloco);
      setUsuario(user);
    } finally {
      setCarregando(false);
    }
  }

  async function logout() {
    await authService.logout();
    setUsuario(null);
  }

  // Permite que não "trave" visualmente caso carregando demore,
  // apenas exportamos que está carregando, quem resolve visualmente é o _layout e as telas.
  return (
    <AuthContext.Provider value={{ usuario, carregando, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
