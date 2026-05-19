import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native";
import Sidebar from "../../components/Sidebar";
import { notify, confirmBrowser } from "../../utils/notify";
import { SkeletonListItem } from "../../components/SkeletonLoader";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { db, firebaseConfig } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { apiFetch } from "../../services/api";
import { useMoradores, useUpdateMorador, useDeleteMorador } from "../../hooks/useMoradores";
import { useQueryClient } from "@tanstack/react-query";

const secondaryApp = getApps().find(app => app.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export default function CadastrarMorador() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { data: moradores = [], isLoading: loading } = useMoradores();
  const queryClient = useQueryClient();
  const { mutateAsync: updateMorador } = useUpdateMorador();
  const { mutateAsync: deleteMorador } = useDeleteMorador();

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [bloco, setBloco] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroBloco, setFiltroBloco] = useState("");

  const moradoresFiltrados = moradores.filter((m) => {
    const nomeCompleto = `${m.nome} ${m.sobrenome}`.toLowerCase();
    const matchesNome =
      filtroNome.trim() === "" || nomeCompleto.includes(filtroNome.toLowerCase());
    const matchesBloco =
      filtroBloco.trim() === "" ||
      m.bloco.toLowerCase().includes(filtroBloco.toLowerCase());
    return matchesNome && matchesBloco;
  });

  function iniciarEdicao(morador: any) {
    setEditId(String(morador.id));
    setNome(morador.sobrenome ? `${morador.nome} ${morador.sobrenome}`.trim() : morador.nome);
    setSobrenome("");
    setBloco(morador.bloco || "");
    setApartamento(morador.apartamento);
    setTelefone(morador.telefone);
    setEmail(morador.email || "");
    // Scroll to top or form position if needed
  }

  function cancelarEdicao() {
    limparFormulario();
    setEditId(null);
  }

  async function handleCadastrar() {
    if (!nome || !apartamento || !telefone || !bloco || !email) {
      return notify("Atenção", "Preencha os campos obrigatórios (Nome, E-mail, Telefone, Bloco e Apartamento)!");
    }
    if (!editId && (!senha || senha.length < 6)) {
      return notify("Atenção", "A senha deve ter pelo menos 6 caracteres para novos moradores.");
    }

    try {
      if (editId) {
        await updateMorador({
          id: editId,
          morador: {
            nome,
            sobrenome: "",
            bloco: bloco.trim(),
            apartamento,
            telefone,
            email,
          }
        });
        notify(" ✅ Sucesso", "Morador atualizado com sucesso!");
        setEditId(null);
      } else {
        // Usa instância secundária para não deslogar o porteiro logado
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), senha);
        const idToken = await cred.user.getIdToken();

        // Sincroniza com a API backend e salva no Oracle DB
        const res = await apiFetch("/auth/firebase-register", {
          method: "POST",
          body: JSON.stringify({ 
            token: idToken, 
            nome: nome.trim(), 
            telefone: telefone.trim(), 
            apartamentoId: apartamento.trim(), 
            bloco: bloco.trim() 
          }),
        });

        if (!res.ok) {
          console.warn("Aviso ao sincronizar backend:", await res.text());
        }

        // Salvar no Firestore
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          nome: nome.trim(),
          email: email.trim(),
          role: "MORADOR",
          ativo: true,
          criadoEm: new Date().toISOString(),
        });

        notify(" ✅ Sucesso", "Morador cadastrado e conta de acesso criada!");
        queryClient.invalidateQueries({ queryKey: ["moradores"] });
      }
      limparFormulario();
    } catch (err: any) {
      console.error("Erro ao salvar morador:", err);
      const msg = err.code === "auth/email-already-in-use"
        ? "Este e-mail já está em uso por outro morador."
        : err.code === "auth/invalid-email"
          ? "O formato do e-mail é inválido."
          : err.message || "Falha ao salvar morador.";
      notify("Erro", msg);
    }
  }

  function limparFormulario() {
    setNome("");
    setSobrenome("");
    setBloco("");
    setApartamento("");
    setTelefone("");
    setEmail("");
    setSenha("");
  }

  async function handleExcluirMorador(id: string) {
    const ok = await confirmBrowser("Deseja realmente excluir este morador?");
    if (!ok) return;

    try {
      await deleteMorador(id);
      notify(" ✅ Sucesso", "Morador removido com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir morador:", err.message ?? err);
      notify("Erro", "Não foi possível excluir o morador.");
    }
  }

  return (
    <View style={styles.container}>
      <Sidebar />
      <ScrollView 
        style={styles.areaConteudo} 
        contentContainerStyle={{ 
          paddingTop: Platform.OS === "android" ? 60 : isMobile ? 70 : 30,
          paddingBottom: 40 
        }}
      >
        <TouchableOpacity onPress={() => router.push("/")} style={styles.voltarBtn}>
          <Text style={styles.voltarTexto}>Início</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={styles.titulo}>
            {editId ? "✏️ Editar Morador" : "👤 Novo Morador"}
          </Text>
          <Text style={styles.subtitulo}>
            {editId ? "Altere as informações abaixo" : "Preencha os dados do novo residente"}
          </Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.cardForm}
        >
          <View style={styles.formRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Ex: Ronaldo Silva" />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Apartamento ID</Text>
              <TextInput style={styles.input} value={apartamento} onChangeText={setApartamento} keyboardType="numeric" placeholder="Ex: 102" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Bloco</Text>
              <TextInput style={styles.input} value={bloco} onChangeText={setBloco} autoCapitalize="characters" placeholder="Ex: A" />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Telefone (WhatsApp)</Text>
              <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholder="(11) 99999-9999" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          {!editId && (
            <View style={styles.formRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Senha de Acesso ao App</Text>
                <TextInput 
                  style={styles.input} 
                  value={senha} 
                  onChangeText={setSenha} 
                  secureTextEntry 
                  placeholder="Mínimo de 6 caracteres" 
                />
              </View>
            </View>
          )}

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.botaoCadastrar} onPress={handleCadastrar}>
              <Text style={styles.textoBotao}>
                {editId ? "Salvar Alterações" : "Finalizar Cadastro"}
              </Text>
            </TouchableOpacity>

            {editId && (
              <TouchableOpacity
                style={styles.botaoCancelar}
                onPress={cancelarEdicao}
              >
                <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Search Section */}
        <View style={styles.headerLista}>
           <Text style={styles.secaoTitulo}>👥 Residentes Cadastrados</Text>
           <Text style={styles.contagem}>{moradoresFiltrados.length} encontrados</Text>
        </View>

        <View style={styles.filtrosBox}>
          <View style={styles.filtroItem}>
             <Text style={styles.iconSearch}>🔍</Text>
             <TextInput
               style={styles.inputFiltro}
               placeholder="Buscar por nome..."
               value={filtroNome}
               onChangeText={setFiltroNome}
             />
          </View>
          <View style={[styles.filtroItem, { width: isMobile ? "100%" : 150 }]}>
             <Text style={styles.iconSearch}>🏢</Text>
             <TextInput
               style={styles.inputFiltro}
               placeholder="Bloco"
               value={filtroBloco}
               onChangeText={setFiltroBloco}
             />
          </View>
        </View>

        {loading ? (
          <View style={{ marginTop: 20 }}>
            {[1, 2, 3, 4].map((i) => <SkeletonListItem key={i} />)}
          </View>
        ) : moradoresFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyIcon}>🔍</Text>
             <Text style={styles.emptyText}>Nenhum morador encontrado com esses filtros.</Text>
          </View>
        ) : (
          <View style={styles.listaMoradores}>
            {moradoresFiltrados.map((m, index) => (
              <Animated.View 
                key={m.id} 
                layout={Layout.springify()}
                entering={FadeInDown.delay(index * 50).duration(400)}
                style={styles.itemContainer}
              >
                <View style={styles.avatarMini}>
                   <Text style={styles.avatarTextMini}>{m.nome[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemNome}>
                    {m.nome} {m.sobrenome}
                  </Text>
                  <Text style={styles.itemInfo}>
                    Bloco {m.bloco} • Ap. {m.apartamento}
                  </Text>
                  <Text style={styles.telefoneText}>📞 {m.telefone}</Text>
                </View>

                <View style={styles.actionsItem}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => iniciarEdicao(m)}
                  >
                    <Text style={styles.actionText}>✏️</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { marginLeft: 8, backgroundColor: "#fee2e2" }]}
                    onPress={() => handleExcluirMorador(String(m.id))}
                  >
                    <Text style={[styles.actionText, { color: "#ef4444" }]}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#f1f5f9" },
  areaConteudo: { flex: 1, padding: 24 },
  voltarBtn: { 
    marginBottom: 24, 
    alignSelf: "flex-end", 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    backgroundColor: "#e2e8f0", 
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center"
  },
  voltarTexto: { color: "#0f172a", fontSize: 14, fontWeight: "600" },
  titulo: { fontSize: 26, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 },
  subtitulo: { color: "#64748b", fontSize: 15, marginBottom: 24, marginTop: 4 },
  cardForm: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    ...Platform.select({
      web: { boxShadow: "0 10px 25px rgba(0,0,0,0.05)" },
      default: { elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }
    })
  },
  formRow: { flexDirection: "row", marginBottom: 4 },
  inputGroup: { marginBottom: 16 },
  label: { fontWeight: "700", fontSize: 13, color: "#334155", marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#1e293b",
    ...Platform.select({
      web: { outlineStyle: "none" as any },
      default: {}
    })
  },
  formActions: { flexDirection: "row", marginTop: 8 },
  botaoCadastrar: {
    backgroundColor: "#0d47a1",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    flex: 2,
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(13, 71, 161, 0.3)" },
      default: { elevation: 3 }
    })
  },
  botaoCancelar: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    flex: 1,
    marginLeft: 12,
  },
  textoBotao: { color: "#fff", fontWeight: "700", fontSize: 15 },
  textoBotaoCancelar: { color: "#64748b", fontWeight: "600", fontSize: 15 },
  headerLista: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  secaoTitulo: { fontSize: 19, fontWeight: "800", color: "#0f172a" },
  contagem: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  filtrosBox: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  filtroItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  iconSearch: { fontSize: 16, marginRight: 8 },
  inputFiltro: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1e293b",
    ...Platform.select({
      web: { outlineStyle: "none" as any },
      default: {}
    })
  },
  listaMoradores: { marginTop: 4 },
  itemContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderColor: "#e2e8f0",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
       web: { boxShadow: "0 2px 8px rgba(0,0,0,0.02)" },
       default: { elevation: 1 }
    })
  },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  avatarTextMini: { color: "#0369a1", fontWeight: "800", fontSize: 18 },
  itemNome: { fontWeight: "700", fontSize: 16, color: "#1e293b" },
  itemInfo: { color: "#64748b", fontSize: 13, marginTop: 2 },
  telefoneText: { color: "#0369a1", fontSize: 12, marginTop: 4, fontWeight: "500" },
  actionsItem: { flexDirection: "row" },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: 14 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: "#64748b", fontSize: 14 },
});
