import React, { useEffect, useState } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import Sidebar from "../../components/Sidebar";
import {
  Encomenda,
  Morador,
} from "../../lib/storage";
import { useMoradores } from "../../hooks/useMoradores";
import { useEncomendas, useCreateEncomenda, useUpdateEncomenda } from "../../hooks/useEncomendas";
import { abrirWhatsApp } from "../../lib/whatsapp";
import { showToast } from "../../components/Toast";
import { SkeletonListItem } from "../../components/SkeletonLoader";
import Animated, { FadeInDown } from "react-native-reanimated";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function RegistrarEncomenda() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.editId as string | undefined;

  const [selectedMoradorId, setSelectedMoradorId] = useState<string>("");
  const [origem, setOrigem] = useState("");
  const [descricao, setDescricao] = useState("");
  const [filtro, setFiltro] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: moradores = [], isLoading: loading } = useMoradores();
  const { data: encomendas = [] } = useEncomendas();
  const { mutateAsync: createEncomenda } = useCreateEncomenda();
  const { mutateAsync: updateEncomendaMutation } = useUpdateEncomenda();

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    if (editId) {
      const e = encomendas.find(x => String(x.id) === editId);
      if (e) {
        setSelectedMoradorId(e.morador ? String(e.morador.id) : (e.moradorId ? String(e.moradorId) : ""));
        setOrigem(e.origem || "");
        setDescricao(e.descricao || "");
      }
    }
  }, [editId, encomendas]);

  const moradoresFiltraveis = moradores.filter((m) => {
    const q = filtro.trim().toLowerCase();
    if (!q) return true;
    const nomeCompleto = `${m.nome} ${m.sobrenome}`.toLowerCase();
    return nomeCompleto.includes(q) || m.bloco.toLowerCase().includes(q) || m.apartamento?.toString().includes(q);
  });

  async function salvar() {
    if (!selectedMoradorId)
      return showToast("Atenção", "Selecione um morador.", "warning");
    if (!origem) return showToast("Atenção", "Preencha a origem da encomenda.", "warning");

    try {
      setSaving(true);
      let resultado: Encomenda;

      const descricaoFinal = descricao.trim() || "Sem observações";

      if (editId) {
        resultado = await updateEncomendaMutation({
          id: editId,
          encomenda: {
            moradorId: Number(selectedMoradorId),
            origem,
            descricao: descricaoFinal,
          }
        });
        showToast(" ✅ Sucesso", "Encomenda atualizada com sucesso!", "success");
      } else {
        resultado = await createEncomenda({
          moradorId: Number(selectedMoradorId),
          origem,
          descricao: descricaoFinal,
        });
        showToast(" ✅ Sucesso", "Encomenda registrada com sucesso!", "success");

        const morador = moradores.find((m) => m.id === Number(selectedMoradorId));
        if (morador?.telefone) {
          const mensagem = `📦 Olá ${morador.nome}! Sua encomenda (${origem}) chegou na portaria.\nToken para retirada: *${resultado.token}*\n\nPor favor, retire na recepção. Obrigado!`;
          abrirWhatsApp(morador.telefone, mensagem);
        }

        const moradorDoc = await getDoc(doc(db, 'users', String(selectedMoradorId)));
        const expoPushToken = moradorDoc.data()?.expoPushToken;

        if (expoPushToken) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: expoPushToken,
              title: '📦 Encomenda chegou!',
              body: `Sua encomenda (${origem}) está na portaria. Token: ${resultado.token}`,
              sound: 'default',
            }),
          });
        }
      }

      router.push("/");
    } catch (err: any) {
      console.error(err);
      showToast("Erro", err.message || "Falha ao processar solicitação.", "error");
    } finally {
      setSaving(false);
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
             {editId ? "📦 Editar Encomenda" : "📦 Nova Encomenda"}
          </Text>
          <Text style={styles.subtitulo}>
             {editId ? "Atualize os dados da correspondência" : "Registre a chegada de um novo pacote"}
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.cardForm}
        >
          {/* Morador Selection */}
          <Text style={styles.secaoLabel}>1. Selecionar Morador</Text>
          
          <View style={styles.searchBox}>
             <Text style={styles.searchIcon}>🔍</Text>
             <TextInput
               style={styles.inputSearch}
               placeholder="Buscar por nome, bloco ou apartamento..."
               value={filtro}
               onChangeText={setFiltro}
             />
          </View>

          <View style={styles.moradorListContainer}>
            {loading ? (
              [1, 2, 3].map(i => <SkeletonListItem key={i} />)
            ) : moradoresFiltraveis.length === 0 ? (
               <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>Nenhum morador encontrado.</Text>
               </View>
            ) : (
              <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
                {moradoresFiltraveis.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedMoradorId(String(item.id))}
                    style={[
                      styles.moradorItem,
                      selectedMoradorId === String(item.id) && styles.moradorItemSelected,
                    ]}
                  >
                    <View style={[styles.moradorCheck, selectedMoradorId === String(item.id) && styles.moradorCheckActive]}>
                       {selectedMoradorId === String(item.id) && <Text style={{ color: "white", fontSize: 10 }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.moradorNome, selectedMoradorId === String(item.id) && { color: "#0d47a1" }]}>
                        {item.nome} {item.sobrenome}
                      </Text>
                      <Text style={styles.moradorInfo}>
                        Bloco {item.bloco} • Ap. {item.apartamento}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={{ height: 24 }} />

          {/* Package Details */}
          <Text style={styles.secaoLabel}>2. Detalhes da Encomenda</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Origem / Transportadora</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Mercado Livre, Shopee, Amazon..."
              value={origem}
              onChangeText={setOrigem}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações (Opcional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Ex: Caixa grande, pacote frágil..."
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />
          </View>

          <TouchableOpacity 
            style={[styles.botao, saving && { opacity: 0.7 }]} 
            onPress={salvar}
            disabled={saving}
          >
            <Text style={styles.textoBotao}>
              {saving ? "Processando..." : editId ? "Salvar Alterações" : "Salvar e Notificar"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: "0 10px 30px rgba(0,0,0,0.06)" },
      default: { elevation: 4 }
    })
  },
  secaoLabel: { fontSize: 16, fontWeight: "800", color: "#334155", marginBottom: 16 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  inputSearch: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1e293b",
    ...Platform.select({ web: { outlineStyle: "none" as any }, default: {} })
  },
  moradorListContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  moradorItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  moradorItemSelected: {
    backgroundColor: "#f0f7ff",
  },
  moradorCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  moradorCheckActive: {
    backgroundColor: "#0d47a1",
    borderColor: "#0d47a1",
  },
  moradorNome: { fontSize: 15, fontWeight: "700", color: "#334155" },
  moradorInfo: { fontSize: 13, color: "#64748b", marginTop: 2 },
  inputGroup: { marginBottom: 20 },
  label: { fontWeight: "700", fontSize: 13, color: "#475569", marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
    ...Platform.select({ web: { outlineStyle: "none" as any }, default: {} })
  },
  botao: {
    backgroundColor: "#0d47a1",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    ...Platform.select({
      web: { boxShadow: "0 6px 15px rgba(13, 71, 161, 0.3)" },
      default: { elevation: 4 }
    })
  },
  textoBotao: { color: "#fff", fontWeight: "700", fontSize: 16 },
  emptySearch: { padding: 20, alignItems: "center" },
  emptySearchText: { color: "#94a3b8", fontSize: 14 },
});
