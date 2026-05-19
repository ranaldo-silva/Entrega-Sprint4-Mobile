// components/Sidebar.tsx
// React Native com Expo — Sidebar com suporte a perfil e logout

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { usuario, logout } = useAuth();
  const [aberta, setAberta] = useState(false);
  const isMobile = width < 768;

  const navegar = (rota: string) => {
    setAberta(false);
    router.push(rota as any);
  };

  const isSuperAdmin = usuario?.role === "ADMIN" && usuario?.email?.toLowerCase().includes("@admin"); // Somente usuário com e-mail contendo '@admin' tem acesso ao painel de gestão de usuários
  const isPorteiro = usuario?.role === "ADMIN";

  const menuItems = [
    { label: "🏠 Início", rota: "/", sempre: true },
    { label: "👤 Cadastrar Morador", rota: "/moradores/cadastrar", sempre: true },
    { label: "📦 Registrar Encomenda", rota: "/encomendas/registrar", sempre: true },
    { label: "✅ Validar Retirada", rota: "/validar-encomenda", sempre: true },
    ...(isSuperAdmin ? [{ label: "⚙️ Gestão de Usuários", rota: "/super-admin", sempre: true }] : []),
  ].filter((m) => m.sempre);

  const conteudo = (
    <>
      <Text style={styles.logo}>Portaria Light</Text>

      {usuario && (
        <View style={styles.perfilInfo}>
          <Text style={styles.perfilNome} numberOfLines={1}>
            {usuario.nome}
          </Text>
          <View style={styles.perfilBadge}>
            <Text style={styles.perfilBadgeTexto}>
              {usuario.role === "ADMIN" ? "Admin (Porteiro)" : "Morador"}
            </Text>
          </View>
        </View>
      )}

      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.rota}
          style={[
            styles.menuButton,
            item.rota === "/super-admin" && styles.menuButtonAdmin,
          ]}
          onPress={() => navegar(item.rota)}
        >
          <Text style={styles.menuText}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={async () => {
          setAberta(false);
          await logout();
        }}
      >
        <Text style={styles.logoutTexto}>🚪 Sair</Text>
      </TouchableOpacity>
    </>
  );

  if (isMobile) {
    return (
      <>
        <TouchableOpacity
          style={styles.hamburguer}
          onPress={() => setAberta((s) => !s)}
          accessibilityLabel="Abrir menu"
        >
          <Text style={styles.hamburguerTexto}>☰</Text>
        </TouchableOpacity>

        <View
          style={[styles.sidebarMobile, { display: aberta ? "flex" : "none" }]}
          pointerEvents={aberta ? "auto" : "none"}
        >
          {conteudo}
        </View>
      </>
    );
  }

  return <View style={styles.sidebar}>{conteudo}</View>;
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: "#0f172a", // Slate 900
    paddingTop: 60,
    paddingHorizontal: 20,
    height: "100%",
    borderRightWidth: 1,
    borderRightColor: "#1e293b",
  },
  sidebarMobile: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 240,
    height: "100%",
    backgroundColor: "#0f172a",
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 30,
    borderRightWidth: 1,
    borderRightColor: "#1e293b",
    ...Platform.select({
      web: {
        boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
      },
      default: {
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
    }),
  },
  logo: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  perfilInfo: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  perfilNome: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  perfilBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)", // Translucent Blue
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  perfilBadgeTexto: { 
    color: "#93c5fd", // Blue 300
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuButton: {
    backgroundColor: "transparent",
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  menuButtonAdmin: {
    backgroundColor: "rgba(139, 92, 246, 0.15)", // Translucent Violet
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    marginTop: 12,
  },
  menuText: { 
    color: "#cbd5e1", // Slate 300
    fontSize: 15,
    fontWeight: "500",
  },
  logoutBtn: {
    marginTop: "auto",
    padding: 14,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.1)", // Translucent Red
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  logoutTexto: { 
    color: "#fca5a5", // Red 300
    fontWeight: "600",
    fontSize: 15,
  },
  hamburguer: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 20,
    left: 20,
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
      default: { elevation: 4 }
    })
  },
  hamburguerTexto: { color: "#fff", fontSize: 26, fontWeight: "bold" },
});
