import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import Sidebar from "../components/Sidebar";
import { confirmarRetirada } from "../lib/storage";
import { notify } from "../utils/notify";
import Animated, { FadeInDown } from "react-native-reanimated";

// Formata a hora local para o fuso horário de São Paulo (GMT-3)
function formatarHoraLocal() {
  const agora = new Date();
  const opcoes: Intl.DateTimeFormatOptions = {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return new Intl.DateTimeFormat("pt-BR", opcoes).format(agora);
}

export default function ValidarEncomenda() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function validar() {
    if (!token.trim()) return notify("Atenção", "Digite o token da encomenda!");

    try {
      setLoading(true);

      await confirmarRetirada(token.trim().toUpperCase());

      // Mostra a hora exata de validação
      const hora = formatarHoraLocal();
      notify("✅ Sucesso", `Retirada confirmada com sucesso às ${hora}.`);

      setToken("");
    } catch (err: any) {
      console.error(err);
      notify("Erro", err.message || "Token inválido ou encomenda não encontrada.");
    } finally {
      setLoading(false);
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
          <Text style={styles.titulo}>✅ Validar Retirada</Text>
          <Text style={styles.subtitulo}>Baixe uma encomenda repassando o pacote ao portador usando o token gerado.</Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.cardForm}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Token de Retirada</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: A5X9B, 1234..."
              value={token}
              onChangeText={setToken}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>

          <TouchableOpacity
            style={[styles.botao, loading && { opacity: 0.6 }]}
            onPress={validar}
            disabled={loading}
          >
            <Text style={styles.textoBotao}>
              {loading ? "Validando..." : "Confirmar Recebimento"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#f1f5f9" },
  areaConteudo: { flex: 1, padding: 30 },
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
    ...Platform.select({
      web: { boxShadow: "0 10px 25px rgba(0,0,0,0.05)" },
      default: { elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }
    })
  },
  inputGroup: { marginBottom: 20 },
  label: { fontWeight: "700", fontSize: 13, color: "#334155", marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
    letterSpacing: 1,
    ...Platform.select({
      web: { outlineStyle: "none" as any },
      default: {}
    })
  },
  botao: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)" },
      default: { elevation: 3 }
    })
  },
  textoBotao: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
