// app/(auth)/register.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { notify } from "../../utils/notify";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [bloco, setBloco] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animação de Fade-In para a view
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  async function handleRegister() {
    if (!nome || !email || !senha || !confirmSenha || !telefone || !apartamento) {
      notify("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }
    if (isNaN(Number(apartamento))) {
      notify("Atenção", "O ID do Apartamento deve ser apenas números.");
      return;
    }
    if (senha !== confirmSenha) {
      notify("Atenção", "As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      notify("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);
    try {
      await register(email.trim(), senha, nome.trim(), telefone.trim(), apartamento.trim(), bloco.trim() || "A");
      notify("Sucesso", "Conta criada com sucesso.");
      // O _layout.tsx redirecionará automaticamente
    } catch (err: any) {
      let msg = "Erro ao criar conta.";
      if (err.code === "auth/email-already-in-use") {
        msg = "Este e-mail já está em uso.";
      } else if (err.code === "auth/invalid-email") {
        msg = "E-mail inválido.";
      } else if (err.message && err.message.includes("Erro API")) {
        msg = err.message; // Puxa direto do Java
      } else {
        msg = err.message || "Erro desconhecido ao cadastrar.";
      }
      console.error("Erro no cadastro:", err);
      notify("Erro de Cadastro", msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>

          <Text style={styles.titulo}>Criar Conta</Text>
          <Text style={styles.subtitulo}>Junte-se à Portaria Light</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
              value={nome}
              onChangeText={setNome}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Telefone"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={setTelefone}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10, width: "100%", marginBottom: 16 }}>
            <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
              <Ionicons name="business-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Bloco (Ex: A)"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                value={bloco}
                onChangeText={setBloco}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
              <Ionicons name="home-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nº Ap. (Num)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={apartamento}
                onChangeText={setApartamento}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              value={senha}
              onChangeText={setSenha}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar Senha"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              value={confirmSenha}
              onChangeText={setConfirmSenha}
              onSubmitEditing={handleRegister}
            />
          </View>

          <TouchableOpacity
            style={[styles.botao, carregando && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={carregando}
            activeOpacity={0.8}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoTexto}>Cadastrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}> Fazer Login</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a", // Dark mode background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    position: 'relative'
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 24,
    padding: 8,
    zIndex: 10,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
    letterSpacing: -0.5,
    marginTop: 10,
  },
  subtitulo: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 32,
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    height: "100%",
  },
  eyeIcon: {
    padding: 5,
  },
  botao: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    height: 56,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#2563eb",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  botaoTexto: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    color: "#64748b",
    fontSize: 14,
  },
  footerLink: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "700",
  },
});
