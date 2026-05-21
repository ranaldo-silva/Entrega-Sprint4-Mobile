import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { apiFetch, TOKEN_STORAGE_KEY } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Role = "ADMIN" | "MORADOR";

export interface UsuarioApp {
  uid: string;
  email: string | null;
  nome: string;
  role: Role;
  apartamento?: string;
  bloco?: string;
  idBackend?: number;
  idMorador?: number;
  expoPushToken?: string;
  ativo: boolean;
}

export const authService = {
  async login(email: string, senha: string): Promise<UsuarioApp> {
    // 1. Firebase Auth
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    const userFirebase = cred.user;
    const idToken = await userFirebase.getIdToken();

    // 2. Chama a API Java para obter dados do usuário e permissões
    const res = await apiFetch("/auth/firebase-login", {
      method: "POST",
      body: JSON.stringify({ token: idToken }),
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(errorMsg || "Erro de autenticação no backend (Spring).");
    }

    const apiUser = await res.json();
    const roleBackend = apiUser.user?.perfil || apiUser.user?.role || "MORADOR";

    // Tenta extrair o nome do morador a partir de várias possibilidades do response da API
    const nomeBackend =
      apiUser.user?.nome ||
      apiUser.user?.name ||
      apiUser.user?.nomeCompleto ||
      (apiUser.user?.nome && apiUser.user?.sobrenome
        ? `${apiUser.user.nome} ${apiUser.user.sobrenome}`.trim()
        : null) ||
      apiUser.nome ||
      apiUser.name ||
      userFirebase.displayName ||
      email.split("@")[0]; // Último recurso: parte antes do @ do e-mail

    const usuarioFinal: UsuarioApp = {
      uid: userFirebase.uid,
      email: userFirebase.email,
      nome: nomeBackend,
      role: roleBackend as Role,
      idBackend: apiUser.user?.id,
      idMorador: apiUser.user?.idMorador || undefined,
      ativo: true,
    };

    // 3. Busca token de push no Firestore (se existir)
    try {
      const docRef = doc(db, "users", userFirebase.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().expoPushToken) {
        usuarioFinal.expoPushToken = docSnap.data().expoPushToken;
      }
    } catch (err) {
      console.warn("Aviso: Falha ao buscar push token do Firestore.", err);
    }

    // 4. Salvar sessão
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, idToken);
    await AsyncStorage.setItem("@portaria_user", JSON.stringify(usuarioFinal));

    return usuarioFinal;
  },

  async register(
    email: string,
    senha: string,
    nome: string,
    telefone: string,
    apartamentoId: string,
    bloco: string
  ): Promise<UsuarioApp> {
    // 1. Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const userFirebase = cred.user;
    const idToken = await userFirebase.getIdToken();

    // 2. Registra na API Java
    const res = await apiFetch("/auth/firebase-register", {
      method: "POST",
      body: JSON.stringify({ token: idToken, nome, telefone, apartamentoId, bloco }),
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(errorMsg || "Erro ao registrar usuário no backend (Spring).");
    }

    const apiUser = await res.json();
    const roleBackend = apiUser.user?.perfil || apiUser.user?.role || "MORADOR";

    // 3. Monta o usuário final com os IDs vindos do backend
    const usuarioFinal: UsuarioApp = {
      uid: userFirebase.uid,
      email: userFirebase.email,
      nome: apiUser.user?.nome || nome,
      role: roleBackend as Role,
      idBackend: apiUser.user?.id,
      idMorador: apiUser.user?.idMorador || undefined,
      ativo: true,
    };

    // Inicializa doc no Firestore apenas para futuro armazenamento do Push Token
    try {
      await setDoc(doc(db, "users", userFirebase.uid), { expoPushToken: "" }, { merge: true });
    } catch (err) {
      console.warn("Aviso: Falha ao inicializar push token doc no Firestore.", err);
    }

    // 4. Salvar sessão
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, idToken);
    await AsyncStorage.setItem("@portaria_user", JSON.stringify(usuarioFinal));
    return usuarioFinal;
  },

  async checkSession(): Promise<{ token: string; user: UsuarioApp } | null> {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    const userStr = await AsyncStorage.getItem("@portaria_user");

    if (token && userStr) {
      return { token, user: JSON.parse(userStr) };
    }
    return null;
  },

  async logout(): Promise<void> {
    await signOut(auth);
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem("@portaria_user");
  },

  async updatePushToken(uid: string, token: string): Promise<void> {
    // Continua usando Firestore para salvar o push token para não quebrar integrações existentes
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { expoPushToken: token }, { merge: true });
      
      const userStr = await AsyncStorage.getItem("@portaria_user");
      if (userStr) {
        const user = JSON.parse(userStr) as UsuarioApp;
        user.expoPushToken = token;
        await AsyncStorage.setItem("@portaria_user", JSON.stringify(user));
      }
    } catch (err) {
      console.error("Erro ao salvar push token no Firestore:", err);
    }
  }
};
