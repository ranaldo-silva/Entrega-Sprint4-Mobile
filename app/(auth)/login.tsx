// app/(auth)/login.tsx
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
  Image,
  Animated,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { notify } from "../../utils/notify";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
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

  async function handleLogin() {
    if (!email || !senha) {
      notify("Atenção", "Preencha e-mail e senha.");
      return;
    }
    setCarregando(true);
    try {
      await login(email.trim(), senha);
      // O _layout.tsx redireciona automaticamente após login
    } catch (err: any) {
      let msg = "Erro ao fazer login. Verifique suas credenciais.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "E-mail ou senha incorretos.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Muitas tentativas. Tente novamente mais tarde.";
      } else if (err.message && err.message.includes("Spring")) {
        msg = err.message; // Mostra a mensagem real do Backend para podermos ler o erro
      } else {
        msg = err.message || "Erro desconhecido ao fazer login.";
      }
      console.error("Erro no login:", err);
      notify("Erro de Autenticação", msg);
    } finally {
      setCarregando(false);
    }
  }

  async function handleRecuperarSenha() {
    if (!email) {
      notify("Atenção", "Digite seu e-mail no campo acima para enviarmos o link de recuperação de senha.");
      return;
    }
    
    setCarregando(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim());
      notify("✅ Sucesso", `Um link de recuperação foi enviado para ${email}. Verifique sua caixa de entrada e spam.`);
    } catch (err: any) {
      console.error("Erro na recuperação:", err);
      if (err.code === "auth/user-not-found") {
        notify("Erro", "Este e-mail não está cadastrado em nosso sistema.");
      } else if (err.code === "auth/invalid-email") {
        notify("Erro", "O formato do e-mail é inválido.");
      } else {
        notify("Erro", "Falha ao enviar e-mail de recuperação. Tente novamente mais tarde.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Animated.View style={[
        styles.card, 
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/modern_logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.titulo}>Portaria Light</Text>
        <Text style={styles.subtitulo}>Acesso seguro ao portal</Text>

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
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.esqueciSennha} onPress={handleRecuperarSenha}>
          <Text style={styles.esqueciSenhaTexto}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botao, carregando && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={carregando}
          activeOpacity={0.8}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Entrar</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem uma conta?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.footerLink}> Cadastre-se</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a", // Dark mode background for premium feel
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  },
  logoContainer: {
    width: 90,
    height: 90,
    marginBottom: 16,
    borderRadius: 45,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
    letterSpacing: -0.5,
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
  esqueciSennha: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  esqueciSenhaTexto: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "600",
  },
  botao: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    height: 56,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
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
