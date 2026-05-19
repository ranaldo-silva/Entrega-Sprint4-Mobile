// components/BotaoAcao.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type BotaoAcaoProps = {
  titulo: string;
  cor: string;
  onPress?: () => void;
};

export default function BotaoAcao({ titulo, cor, onPress }: BotaoAcaoProps) {
  return (
    <TouchableOpacity style={[styles.botao, { backgroundColor: cor }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.texto}>{titulo}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    alignItems: "center",
  },
  texto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
