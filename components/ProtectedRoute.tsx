// components/ProtectedRoute.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useAuth } from "../context/AuthContext";
import { Role } from "../services/authService";
import { useRouter, usePathname } from "expo-router";

interface Props {
  roles: Role[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ roles, children }: Props) {
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!carregando && usuario) {
      if (!roles.includes(usuario.role)) {
        let target: any = "/";
        if (usuario.role === "MORADOR") target = "/morador";
        
        if (pathname !== target) {
          router.replace(target);
        }
      }
    }
  }, [carregando, usuario, JSON.stringify(roles)]);

  if (carregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Se não tem usuário ou o usuário não tem a role permitida, não renderiza nada (o useEffect vai redirecionar)
  if (!usuario || !roles.includes(usuario.role)) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff" }}>Não autorizado. Redirecionando...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
});
