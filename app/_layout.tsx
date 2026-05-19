// app/_layout.tsx
// React Native com Expo — Layout raiz com AuthProvider e redirecionamento de rota

import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import ToastContainer from "../components/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

function RootNavigation() {
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (carregando) return;

    const estaNoAuth = segments[0] === "(auth)";

    // Lógica robusta de redirecionamento baseada no estado do usuário
    if (!usuario && !estaNoAuth) {
      // Usuário não autenticado tentando acessar área interna -> joga pro login
      router.replace("/(auth)/login");
    } else if (usuario && estaNoAuth) {
      // Usuário autenticado tentando acessar telas de auth -> joga pra home/dashboard correto
      if (usuario.role === "MORADOR") {
        router.replace("/morador");
      } else {
        // ADMIN (Porteiro) vai para a tela inicial padrão
        router.replace("/");
      }
    }
  }, [usuario, carregando, segments]);

  // Enquanto valida a sessão no AsyncStorage ou recarrega do Firebase
  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Renderiza a navegação principal quando o carregamento finalizar
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Grupo de autenticação (sem sidebar) */}
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/register" />

      {/* Telas protegidas */}
      <Stack.Screen name="index" />
      <Stack.Screen name="moradores/cadastrar" />
      <Stack.Screen name="encomendas/registrar" />
      <Stack.Screen name="validar-encomenda" />

      {/* Super Admin */}
      <Stack.Screen name="super-admin/index" />

      {/* Morador */}
      <Stack.Screen name="morador/index" />
    </Stack>
  );
}

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
          <RootNavigation />
          <ToastContainer />
        </View>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a", // Mantém consistência visual do tema premium
  }
});
