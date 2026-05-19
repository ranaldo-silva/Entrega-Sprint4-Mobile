// components/TituloSessao.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";

export default function TituloSessao({ texto }: { texto: string }) {
  return <Text style={styles.titulo}>{texto}</Text>;
}

const styles = StyleSheet.create({
  titulo: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#0d47a1" },
});
