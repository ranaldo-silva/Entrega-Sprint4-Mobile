// app/morador/index.tsx
// Tela do Morador — exibe somente as encomendas do morador logado via API Spring Boot
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useFocusEffect } from "expo-router";
import { Encomenda } from "../../lib/storage";
import { useEncomendas } from "../../hooks/useEncomendas";

function formatarData(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function MoradorScreen() {
  const { usuario, logout } = useAuth();
  
  const { data: todas = [], isLoading: loading, refetch, isFetching } = useEncomendas();

  const encomendas = (usuario?.idMorador || usuario?.idBackend)
    ? todas.filter((e: any) => {
        const moradorId = e.morador?.id || e.moradorId;
        return String(moradorId) === String(usuario.idMorador) || String(moradorId) === String(usuario.idBackend);
      })
    : [];

  const refreshing = isFetching;
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const pendentes = encomendas.filter((e) => !e.retirada);
  const retiradas = encomendas.filter((e) => e.retirada);
  const primeiroNome = usuario?.nome?.split(" ")[0] || "Morador";

  return (
    <ProtectedRoute roles={["MORADOR"]}>
      <View style={styles.container}>
        {/* Header fixo no topo com shadow */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titulo}>📦 Portal do Morador</Text>
              <Text style={styles.headerSub}>{usuario?.email}</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.sairBtn}>
              <Text style={styles.sairTexto}>🚪 Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]} />
          }
        >
          <View style={styles.cardGeral}>
            <Text style={styles.saudacao}>
              {saudacao()}, <Text style={{ color: "#3b82f6" }}>{primeiroNome}</Text>! 👋
            </Text>
            <Text style={styles.subtitulo}>
              Acompanhe suas encomendas com facilidade e segurança.
            </Text>

            {/* Resumo rápido */}
            <View style={styles.resumoRow}>
              <View style={[styles.resumoCard, { backgroundColor: "#fef3c7", borderColor: "#fde68a" }]}>
                <Text style={styles.resumoNum}>{pendentes.length}</Text>
                <Text style={styles.resumoLabel}>⏳ Pendentes</Text>
              </View>
              <View style={[styles.resumoCard, { backgroundColor: "#d1fae5", borderColor: "#a7f3d0" }]}>
                <Text style={styles.resumoNum}>{retiradas.length}</Text>
                <Text style={styles.resumoLabel}>✅ Retiradas</Text>
              </View>
              <View style={[styles.resumoCard, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
                <Text style={styles.resumoNum}>{encomendas.length}</Text>
                <Text style={styles.resumoLabel}>📦 Total</Text>
              </View>
            </View>

            <Text style={styles.secaoTitulo}>Histórico de Encomendas</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
            ) : encomendas.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 54, marginBottom: 16 }}>📭</Text>
                <Text style={styles.emptyTitle}>Nenhuma encomenda por aqui</Text>
                <Text style={styles.emptyText}>
                  Quando uma encomenda chegar para você, ela aparecerá aqui automaticamente com o seu Token de Retirada.
                </Text>
              </View>
            ) : (
              encomendas.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    item.retirada && styles.cardRetirada,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[
                      styles.iconCircle, 
                      { backgroundColor: item.retirada ? "#d1fae5" : "#fef3c7" }
                    ]}>
                      <Text style={styles.cardIcon}>
                        {item.retirada ? "✅" : "⏳"}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.origem}>
                        {item.descricao || item.origem || "Encomenda"}
                      </Text>
                      <Text style={styles.origemSub}>
                        Origem: {item.origem || "Não informada"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: item.retirada
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(245,158,11,0.1)",
                          borderColor: item.retirada ? "#34d399" : "#fbbf24",
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: item.retirada ? "#059669" : "#d97706",
                          },
                        ]}
                      >
                        {item.retirada ? "Retirada" : "Pendente"}
                      </Text>
                    </View>
                  </View>

                  {!item.retirada && item.token && item.token !== "—" && (
                    <View style={styles.tokenRow}>
                      <Text style={styles.tokenLabel}>Seu Token Secreto:</Text>
                      <Text style={styles.tokenValue}>{item.token}</Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.dataText}>
                      📅 Recebida em: {formatarData(item.dataRecebimento || item.dataRegistro)}
                    </Text>
                    {item.retirada && item.retiradaEm && (
                      <Text style={styles.dataText}>
                        ✅ Retirada em: {formatarData(item.retiradaEm)}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f4f4f5" 
  },
  header: {
    backgroundColor: "#0f172a",
    paddingTop: Platform.OS === "android" ? 50 : 20,
    paddingBottom: 20,
    width: "100%",
    ...Platform.select({
      web: { 
        position: 'sticky', 
        top: 0, 
        zIndex: 50,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
      },
      default: { elevation: 8 },
    }),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  titulo: { fontSize: 24, fontWeight: "900", color: "#f8fafc", letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: "#94a3b8", marginTop: 4, fontWeight: "500" },
  sairBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  sairTexto: { color: "#fca5a5", fontWeight: "700", fontSize: 14 },
  scrollArea: {
    flex: 1,
  },
  scrollContent: { 
    padding: 24, 
    paddingBottom: 60,
    alignItems: "center", // Centraliza o conteúdo no desktop
  },
  cardGeral: {
    width: "100%",
    maxWidth: 800, // Limita a largura em telas grandes (computador)
  },
  saudacao: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitulo: { fontSize: 16, color: "#64748b", marginBottom: 28, fontWeight: "500" },
  resumoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
    flexWrap: "wrap", // Quebra a linha em telas muito pequenas
  },
  resumoCard: {
    flex: 1,
    minWidth: 100,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
      default: { elevation: 2 },
    }),
  },
  resumoNum: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
  },
  resumoLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "700",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  secaoTitulo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      web: { boxShadow: "0 8px 30px rgba(0,0,0,0.04)" },
      default: { elevation: 4 },
    }),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyText: { color: "#64748b", fontSize: 15, textAlign: "center", lineHeight: 22 },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(0,0,0,0.04)" },
      default: { elevation: 3 },
    }),
  },
  cardRetirada: {
    opacity: 0.65,
    backgroundColor: "#fafafa",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIcon: { fontSize: 24 },
  origem: { fontSize: 18, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 },
  origemSub: { fontSize: 14, color: "#64748b", marginTop: 2, fontWeight: "500" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tokenLabel: { fontSize: 14, color: "#475569", fontWeight: "600" },
  tokenValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2563eb",
    letterSpacing: 2,
  },
  cardFooter: { 
    marginTop: 16, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8
  },
  dataText: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
});
