// app/index.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Sidebar from "../components/Sidebar";
import { Encomenda } from "../lib/storage";
import { Animated } from "react-native";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../components/Toast";
import { SkeletonCard, SkeletonListItem } from "../components/SkeletonLoader";
import { abrirWhatsApp } from "../lib/whatsapp";
import { confirmBrowser } from "../utils/notify";
import ProtectedRoute from "../components/ProtectedRoute";
import { useMoradores } from "../hooks/useMoradores";
import { useEncomendas, useDeleteEncomenda } from "../hooks/useEncomendas";

// Mostra data/hora no fuso de São Paulo (GMT-3)
function formatarData(iso?: string) {
  if (!iso) return "—";
  try {
    const data = new Date(iso);
    const opcoes: Intl.DateTimeFormatOptions = {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Intl.DateTimeFormat("pt-BR", opcoes).format(data);
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

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { usuario } = useAuth();
  const isMobile = width < 768;

  const { data: moradores = [], isLoading: loadingMoradores } = useMoradores();
  const { data: encomendas = [], isLoading: loadingEncomendas, isError: hasError, refetch } = useEncomendas();
  const { mutateAsync: deletar } = useDeleteEncomenda();

  const loading = loadingMoradores || loadingEncomendas;
  const moradoresCount = moradores.length;

  const totalRetiradas = encomendas.filter((e) => e.retirada).length;
  const pendentes = encomendas.filter((e) => !e.retirada).length;
  const recentes = [...encomendas]
    .sort((a, b) => {
      const ta = new Date(a.dataRegistro ?? a.dataRecebimento ?? 0).getTime();
      const tb = new Date(b.dataRegistro ?? b.dataRecebimento ?? 0).getTime();
      return tb - ta;
    })
    .slice(0, 5);

  async function confirmarExcluirEncomenda(id: string | number) {
    const ok = await confirmBrowser("Deseja excluir essa encomenda?");
    if (!ok) return;

    try {
      await deletar(id);
      showToast("Sucesso", "Encomenda excluída.", "success");
    } catch (err) {
      console.error(err);
      showToast("Erro", "Falha ao excluir encomenda.", "error");
    }
  }

  const CARDS = [
    {
      titulo: "Moradores",
      valor: moradoresCount,
      icon: "👥",
      gradStart: "#1e40af",
      gradEnd: "#3b82f6",
    },
    {
      titulo: "Encomendas",
      valor: encomendas.length,
      icon: "📦",
      gradStart: "#065f46",
      gradEnd: "#10b981",
    },
    {
      titulo: "Pendentes",
      valor: pendentes,
      icon: "⏳",
      gradStart: "#92400e",
      gradEnd: "#f59e0b",
    },
    {
      titulo: "Retiradas",
      valor: totalRetiradas,
      icon: "✅",
      gradStart: "#6b21a8",
      gradEnd: "#a855f7",
    },
  ];

  const primeiroNome = usuario?.nome?.split(" ")[0] || "Usuário";
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <View style={styles.container}>
        <Sidebar />
        <ScrollView
          style={styles.areaConteudo}
          contentContainerStyle={{ 
            paddingTop: Platform.OS === "android" ? 60 : isMobile ? 70 : 30,
            paddingBottom: 80 
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Saudação */}
          <View style={styles.headerContainer}>
            <View style={{ flex: 1, minWidth: 200 }}>
              <Text style={styles.saudacao}>
                {saudacao()}, {primeiroNome}! 👋
              </Text>
              <Text style={styles.subtitulo}>
                Confira o resumo da portaria hoje
              </Text>
            </View>
            {usuario?.role === "ADMIN" && usuario?.email?.toLowerCase().includes("@admin") && (
              <TouchableOpacity
                onPress={() => router.push("/super-admin")}
                style={styles.adminBadgeBtn}
              >
                <Text style={styles.adminBadgeText}>⚙️ Painel Super Admin</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 📊 Cards */}
          {loading ? (
            <View
              style={[
                styles.cardsContainer,
                isMobile && { flexDirection: "column" },
              ]}
            >
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.cardsContainer,
                isMobile && { flexDirection: "column" },
              ]}
            >
              {CARDS.map((c, i) => (
                <View
                  key={c.titulo}
                  style={[
                    styles.card,
                    isMobile && { marginBottom: 12 },
                  ]}
                >
                  {/* Gradient layers */}
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: c.gradStart, borderRadius: 16 },
                    ]}
                  />
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: c.gradEnd,
                        borderRadius: 16,
                        opacity: 0.6,
                        transform: [{ translateY: 10 }],
                      },
                    ]}
                  />
                  {/* Decorative circle */}
                  <View
                    style={[
                      styles.cardCircle,
                      { backgroundColor: "rgba(255,255,255,0.1)" },
                    ]}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardIcon}>{c.icon}</Text>
                    <Text style={styles.cardValor}>{c.valor}</Text>
                    <Text style={styles.cardTitulo}>{c.titulo}</Text>
                  </View>
                  </View>
              ))}
            </View>
          )}

          {/* 📦 Lista de encomendas */}
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoTitulo}>📦 Encomendas Recentes</Text>
            <TouchableOpacity
              onPress={() => router.push("/encomendas/registrar")}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+ Nova</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View>
              {[1, 2, 3].map((i) => (
                <SkeletonListItem key={i} />
              ))}
            </View>
          ) : hasError ? (
            <View style={[styles.emptyState, { borderColor: "#ef4444" }]}>
              <Text style={styles.emptyIcon}>🔌</Text>
              <Text style={styles.emptyTitle}>Servidor Offline</Text>
              <Text style={[styles.emptyText, { textAlign: "center", marginHorizontal: 20 }]}>
                Não foi possível conectar à API. Verifique se o servidor Spring Boot no Azure está rodando e tente novamente.
              </Text>
              <TouchableOpacity
                style={[styles.emptyCta, { backgroundColor: "#ef4444" }]}
                onPress={() => refetch()}
              >
                <Text style={styles.emptyCtaText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          ) : recentes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>Nenhuma encomenda</Text>
              <Text style={styles.emptyText}>
                As encomendas registradas aparecerão aqui.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => router.push("/encomendas/registrar")}
              >
                <Text style={styles.emptyCtaText}>Registrar Encomenda</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {recentes.map((item, index) => {
                const nomeMorador = item.morador
                  ? `${item.morador.nome || ""} ${item.morador.sobrenome || ""}`.trim() || "Morador sem nome"
                  : "—";
                const dataRef =
                  item.retiradaEm || item.dataRegistro || item.dataRecebimento;

                return (
                  <View
                    key={String(item.id)}
                  >
                    <View style={styles.item}>
                      <View style={styles.itemHeader}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: item.retirada
                                ? "#22c55e"
                                : "#f59e0b",
                            },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemToken}>
                            Token: {item.token || "—"}
                          </Text>
                          <Text style={styles.itemOrigem}>
                            {item.origem || "Origem não informada"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemDetails}>
                        <Text style={styles.itemMorador}>
                          👤 {nomeMorador}
                        </Text>
                        <Text style={styles.itemData}>
                          {item.retirada
                            ? `✅ Retirada em ${formatarData(item.retiradaEm)}`
                            : `⏳ Recebida em ${formatarData(dataRef)}`}
                        </Text>
                      </View>

                      <View style={styles.itemActions}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() =>
                            router.push(
                              `/encomendas/registrar?editId=${item.id}`
                            )
                          }
                        >
                          <Text style={styles.actionText}>✏️ Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => confirmarExcluirEncomenda(item.id!)}
                        >
                          <Text style={[styles.actionText, styles.deleteText]}>
                            🗑️ Excluir
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.whatsappBtn]}
                          onPress={() => {
                            // A API de encomendas retorna apenas o Resumo do morador (id, nome). 
                            // Buscamos o morador completo na lista cacheados para pegar o telefone.
                            const moradorCompleto = moradores.find(m => String(m.id) === String(item.morador?.id));

                            if (moradorCompleto && moradorCompleto.telefone) {
                              const nome =
                                `${moradorCompleto.nome} ${moradorCompleto.sobrenome || ""}`.trim();
                              const msg = `Olá ${nome}! 📦\n\nSua encomenda de ${item.origem || "origem não informada"} chegou na portaria.\n\nToken para retirada: *${item.token}*.\n\nObrigado! 🏢`;
                              abrirWhatsApp(moradorCompleto.telefone, msg);
                            } else {
                              showToast(
                                "Atenção",
                                "O morador não possui telefone cadastrado.",
                                "warning"
                              );
                            }
                          }}
                        >
                          <Text style={[styles.actionText, styles.whatsappText]}>
                            💬 WhatsApp
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f8fafc",
  },
  areaConteudo: {
    flex: 1,
    padding: 24,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  adminBadgeBtn: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  adminBadgeText: {
    color: "#7c3aed",
    fontWeight: "700",
    fontSize: 14,
  },
  saudacao: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  subtitulo: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 4,
  },
  cardsContainer: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 28,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 130,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    ...Platform.select({
      web: {
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      },
      default: {
        elevation: 8,
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
    }),
  },
  cardCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -20,
    right: -20,
  },
  cardContent: {
    padding: 18,
    zIndex: 1,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardValor: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  cardTitulo: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  secaoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  addBtn: {
    backgroundColor: "#0d47a1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
  },
  emptyCta: {
    backgroundColor: "#0d47a1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCtaText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  item: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderColor: "#e2e8f0",
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
      },
      default: {
        elevation: 3,
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
    }),
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  itemToken: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  itemOrigem: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  itemDetails: {
    paddingLeft: 22,
    marginBottom: 12,
  },
  itemMorador: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  itemData: {
    color: "#64748b",
    marginTop: 4,
    fontSize: 13,
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 20, // Pill shape
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  deleteBtn: {
    backgroundColor: "#fef2f2",
  },
  deleteText: {
    color: "#dc2626",
  },
  whatsappBtn: {
    backgroundColor: "#f0fdf4",
  },
  whatsappText: {
    color: "#16a34a",
  },
});
