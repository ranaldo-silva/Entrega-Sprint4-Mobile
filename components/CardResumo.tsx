// components/CardResumo.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CardResumo({ titulo, valor, cor }: { titulo: string; valor: number; cor: string }) {
  return (
    <View style={[styles.card, { borderLeftColor: cor }]}>
      <Text style={styles.valor}>{valor}</Text>
      <Text style={styles.titulo}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: 150,
    borderLeftWidth: 5,
    elevation: 2,
  },
  valor: { fontSize: 22, fontWeight: "bold", color: "#333" },
  titulo: { fontSize: 14, color: "#555" },
});
