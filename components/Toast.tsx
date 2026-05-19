// components/Toast.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: number;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastRef {
  show: (title: string, message?: string, type?: ToastType) => void;
}

let _toastRef: ToastRef | null = null;

// Função global para mostrar toast de qualquer lugar
export function showToast(title: string, message?: string, type: ToastType = "info") {
  if (_toastRef) {
    _toastRef.show(title, message, type);
  } else if (Platform.OS === "web") {
    // Fallback se toast não montado ainda
    console.log(`[${type.toUpperCase()}] ${title}: ${message || ""}`);
  }
}

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: "#f0fdf4", border: "#22c55e", icon: "✅" },
  error: { bg: "#fef2f2", border: "#ef4444", icon: "❌" },
  warning: { bg: "#fffbeb", border: "#f59e0b", icon: "⚠️" },
  info: { bg: "#eff6ff", border: "#3b82f6", icon: "ℹ️" },
};

let _idCounter = 0;

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((title: string, message?: string, type: ToastType = "info") => {
    const id = ++_idCounter;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    _toastRef = { show };
    return () => {
      _toastRef = null;
    };
  }, [show]);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const colors = TOAST_COLORS[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade out before removal
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Text style={styles.icon}>{colors.icon}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{toast.title}</Text>
        {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "web" ? 20 : 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
    minWidth: 300,
    maxWidth: 500,
    ...Platform.select({
      web: {
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      },
      default: {
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  message: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
});
