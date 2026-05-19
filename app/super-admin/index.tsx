// app/super-admin/index.tsx
// React Native com Expo — Tela de Gestão de Equipe hierárquica (Super Admin)

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { db, auth, firebaseConfig } from "../../lib/firebase";
import { apiFetch } from "../../services/api";

const secondaryApp = getApps().find(app => app.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);
import { useAuth } from "../../context/AuthContext";
import { Role, UsuarioApp } from "../../services/authService";
import { useRouter } from "expo-router";
import { notify } from "../../utils/notify";
import ProtectedRoute from "../../components/ProtectedRoute";

const ROLES: { label: string; value: Role }[] = [
  { label: "Admin (Porteiro)", value: "ADMIN" },
  { label: "Morador", value: "MORADOR" },
];

export default function GestaoEquipeScreen() {
  const { usuario, logout } = useAuth();
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<UsuarioApp[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [roleSelecionada, setRoleSelecionada] = useState<Role>("ADMIN");
  const [telefone, setTelefone] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [bloco, setBloco] = useState("");

  const isSuperAdmin = usuario?.role === "ADMIN" && usuario?.email?.toLowerCase().includes("@admin");

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const lista: UsuarioApp[] = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() } as UsuarioApp));
      setUsuarios(lista);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      notify("Acesso Negado", "Apenas o Super Admin tem permissão para acessar esta tela.");
      router.replace("/");
    } else {
      carregarUsuarios();
    }
  }, [isSuperAdmin, carregarUsuarios]);

  function limparForm() {
    setNome("");
    setEmail("");
    setSenha("");
    setRoleSelecionada("ADMIN");
    setTelefone("");
    setApartamento("");
    setBloco("");
  }

  async function handleCadastrar() {
    if (!nome || !email || !senha) {
      notify("Atenção", "Preencha os campos básicos (nome, email, senha).");
      return;
    }
    if (roleSelecionada === "MORADOR" && (!telefone || !apartamento || !bloco)) {
      notify("Atenção", "Preencha telefone, bloco e apartamento para cadastrar um morador.");
      return;
    }
    if (senha.length < 6) {
      notify("Atenção", "A senha deve ter ao menos 6 caracteres.");
      return;
    }

    setSalvando(true);
    try {
      // Usa uma instância secundária para não deslogar o Super Admin atual
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), senha);
      const idToken = await cred.user.getIdToken();

      // Sincroniza com a API backend (Banco Relacional) para evitar erro de login futuro
      const res = await apiFetch("/auth/firebase-register", {
        method: "POST",
        body: JSON.stringify({ 
          token: idToken, 
          nome: nome.trim(), 
          telefone: roleSelecionada === "MORADOR" ? telefone.trim() : "00000000000", 
          apartamentoId: roleSelecionada === "MORADOR" ? apartamento.trim() : "1", 
          bloco: roleSelecionada === "MORADOR" ? bloco.trim() : "A" 
        }),
      });

      if (!res.ok) {
        console.warn("Aviso ao sincronizar backend:", await res.text());
      }

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        nome: nome.trim(),
        email: email.trim(),
        role: roleSelecionada,
        ativo: true,
        criadoEm: new Date().toISOString(),
      });

      notify("Sucesso", "Usuário cadastrado com sucesso!");
      limparForm();
      carregarUsuarios();
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "Este e-mail já está cadastrado."
          : err.code === "auth/invalid-email"
            ? "E-mail inválido."
            : "Erro ao cadastrar usuário.";
      notify("Erro", msg);
    } finally {
      setSalvando(false);
    }
  }

  async function toggleAtivo(u: UsuarioApp) {
    try {
      await updateDoc(doc(db, "users", u.uid), { ativo: !u.ativo });
      carregarUsuarios();
    } catch {
      notify("Erro", "Não foi possível atualizar o status.");
    }
  }

  function confirmarExcluir(u: UsuarioApp) {
    if (u.uid === usuario?.uid) {
      return notify("Atenção", "Você não pode excluir a si mesmo.");
    }
    if (Platform.OS === "web") {
      if (!window.confirm(`Excluir ${u.nome}?`)) return;
      excluirUsuario(u);
    } else {
      Alert.alert("Confirmar", `Excluir ${u.nome}?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => excluirUsuario(u) },
      ]);
    }
  }

  async function excluirUsuario(u: UsuarioApp) {
    try {
      await deleteDoc(doc(db, "users", u.uid));
      notify("Sucesso", "Usuário removido da listagem e acessos.");
      carregarUsuarios();
    } catch {
      notify("Erro", "Não foi possível excluir o usuário.");
    }
  }

  const labelRole = (r: Role) => {
    if (r === "ADMIN") return "Admin (Porteiro)";
    return "Morador";
  }

  const corRole = (r: Role) => {
    if (r === "ADMIN") return "#8e24aa";
    return "#388e3c";
  }

  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titulo}>⚙️ Gestão de Equipe</Text>
          <TouchableOpacity onPress={logout} style={styles.sairBtn}>
            <Text style={styles.sairTexto}>Sair</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/")} style={styles.voltarBtn}>
          <Text style={styles.voltarTexto}>Início</Text>
        </TouchableOpacity>

        {/* Formulário de Cadastro */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Adicionar Usuário</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            placeholderTextColor="#94a3b8"
            value={nome}
            onChangeText={setNome}
          />

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha (mín. 6 caracteres)"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <Text style={styles.labelInput}>Nível de acesso</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.roleBtn,
                  roleSelecionada === r.value && {
                    backgroundColor: corRole(r.value),
                    borderColor: corRole(r.value),
                  },
                ]}
                onPress={() => setRoleSelecionada(r.value)}
              >
                <Text
                  style={[
                    styles.roleBtnTexto,
                    roleSelecionada === r.value && { color: "#fff" },
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {roleSelecionada === "MORADOR" && (
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={styles.input}
                placeholder="Apartamento ID (Ex: 102)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={apartamento}
                onChangeText={setApartamento}
              />
              <TextInput
                style={styles.input}
                placeholder="Bloco (Ex: A)"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                value={bloco}
                onChangeText={setBloco}
              />
              <TextInput
                style={[styles.input, { marginBottom: 0 }]}
                placeholder="Telefone (WhatsApp)"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={telefone}
                onChangeText={setTelefone}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.botao, salvando && { opacity: 0.7 }]}
            onPress={handleCadastrar}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoTexto}>+ Cadastrar Usuário</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lista de Usuários */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Usuários Cadastrados</Text>

          {carregando ? (
            <ActivityIndicator color="#0d47a1" style={{ marginTop: 16 }} />
          ) : usuarios.length === 0 ? (
            <Text style={styles.vazio}>Nenhum usuário cadastrado.</Text>
          ) : (
            usuarios.map((u) => {
              return (
                <View key={u.uid} style={styles.usuarioItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.usuarioNome}>{u.nome}</Text>
                    <Text style={styles.usuarioEmail}>{u.email}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, { backgroundColor: corRole(u.role) }]}>
                        <Text style={styles.badgeTexto}>{labelRole(u.role)}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: u.ativo ? "#2e7d32" : "#b71c1c" }]}>
                        <Text style={styles.badgeTexto}>{u.ativo ? "Ativo" : "Inativo"}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.acoesCol}>
                    <TouchableOpacity
                      style={[styles.acaoBtn, { backgroundColor: u.ativo ? "#e65100" : "#2e7d32" }]}
                      onPress={() => toggleAtivo(u)}
                    >
                      <Text style={styles.acaoBtnTexto}>{u.ativo ? "Desativar" : "Ativar"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.acaoBtn, { backgroundColor: "#b71c1c", marginTop: 6 }]}
                      onPress={() => confirmarExcluir(u)}
                    >
                      <Text style={styles.acaoBtnTexto}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  header: {
    backgroundColor: "#0d47a1",
    paddingTop: Platform.OS === "android" ? 50 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  sairBtn: {
    backgroundColor: "#ffffff30",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sairTexto: { color: "#fff", fontWeight: "600" },
  voltarBtn: { 
    marginHorizontal: 16, 
    marginBottom: 16, 
    alignSelf: "flex-end", 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    backgroundColor: "#e2e8f0", 
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center"
  },
  voltarTexto: { color: "#0d47a1", fontSize: 14, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  secaoTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 16,
  },
  labelInput: { fontSize: 13, color: "#475569", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  roleBtnTexto: { fontWeight: "600", color: "#475569", fontSize: 12, textAlign: "center" },
  botao: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  botaoTexto: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  vazio: { color: "#94a3b8", textAlign: "center", marginTop: 8 },
  usuarioItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  usuarioNome: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  usuarioEmail: { fontSize: 13, color: "#64748b", marginTop: 2 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeTexto: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  acoesCol: { justifyContent: "center" },
  acaoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  acaoBtnTexto: { color: "#fff", fontWeight: "600", fontSize: 12 },
});
