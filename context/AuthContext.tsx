import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, UsuarioApp } from "../services/authService";
import { registerForPushNotificationsAsync } from "../services/pushNotificationService";
import { auth } from "../lib/firebase";
import { TOKEN_STORAGE_KEY } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
        // 1. Aguarda o Firebase Auth carregar/restaurar a sessão persistida no React Native
        await new Promise<void>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged(() => {
            unsubscribe();
            resolve();
          });
        });

        // 2. Se houver um usuário autenticado no Firebase, obtém um ID Token fresco
        if (auth.currentUser) {
          try {
            const freshToken = await auth.currentUser.getIdToken(true);
            await AsyncStorage.setItem(TOKEN_STORAGE_KEY, freshToken);
          } catch (tokenErr) {
            console.warn("Aviso: Falha ao obter token renovado do Firebase:", tokenErr);
          }
        }

        // 3. Verifica a sessão local
        const session = await authService.checkSession();
        if (session) {
          // Garante que se o Firebase deslogou, a sessão local também é encerrada
          if (!auth.currentUser) {
            await authService.logout();
            setUsuario(null);
          } else if (!session.user.role || (session.user.role !== "ADMIN" && session.user.role !== "MORADOR")) {
            // Se o usuário não tem role ou a role é inválida/antiga, força logout
            await authService.logout();
            setUsuario(null);
          } else {
            setUsuario(session.user);
          }
        } else {
          // Se não houver sessão local mas houver usuário no Firebase, desloga para manter em sincronia
          if (auth.currentUser) {
            await authService.logout();
          }
          setUsuario(null);
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

  // Escuta mudanças de token do Firebase Auth (renovação automática) e sincroniza no AsyncStorage
  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
        } catch (err) {
          console.error("Erro ao sincronizar token renovado no AsyncStorage:", err);
        }
      }
    });
    return unsubscribe;
  }, []);

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
