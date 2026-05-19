// utils/notify.ts
import { Alert, Platform } from "react-native";
import { showToast } from "../components/Toast";

export function notify(title: string, message?: string) {
  const text = message ?? "";
  console.log(`${title}${text ? " — " + text : ""}`);

  // Determina o tipo de toast pelo título
  let type: "success" | "error" | "warning" | "info" = "info";
  const lower = title.toLowerCase();
  if (lower.includes("sucesso") || lower.includes("✅")) type = "success";
  else if (lower.includes("erro") || lower.includes("falha")) type = "error";
  else if (lower.includes("atenção") || lower.includes("aviso")) type = "warning";

  // Usa toast na web, Alert no mobile
  if (Platform.OS === "web") {
    showToast(title, text, type);
  } else {
    Alert.alert(title, text);
  }
}

export function confirmBrowser(message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    const ok = window.confirm(message);
    return Promise.resolve(ok);
  }
  return Promise.resolve(true);
}
