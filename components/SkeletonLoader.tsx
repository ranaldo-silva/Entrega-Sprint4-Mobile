// components/SkeletonLoader.tsx
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonLoader width="60%" height={16} />
      <SkeletonLoader width="40%" height={28} style={{ marginTop: 8 }} />
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <View style={{ flex: 1 }}>
        <SkeletonLoader width="80%" height={14} />
        <SkeletonLoader width="50%" height={12} style={{ marginTop: 6 }} />
      </View>
      <SkeletonLoader width={60} height={28} borderRadius={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#cbd5e1",
  },
  card: {
    flex: 1,
    marginRight: 10,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
});
