// Render a shared Expo UI component for Insight Card.
import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../constants/colors";

type InsightCardProps = {
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof MaterialIcons>["name"];
  onPress: () => void;
  delay?: number;
};

export function InsightCard({
  title,
  subtitle,
  icon,
  onPress,
  delay = 0,
}: InsightCardProps) {
  const { width } = useWindowDimensions();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const isCompact = width < 390;
  const cardWidth = isCompact ? "100%" : "48%";

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, fade]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 90,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { width: cardWidth, opacity: fade, transform: [{ scale }] }]}>
      <Pressable style={styles.card} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={styles.iconBadge}>
          <MaterialIcons name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 120,
    justifyContent: "space-between",
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.11,
    shadowRadius: 16,
    elevation: 5,
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: colors.secondarySoft,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  title: {
    color: colors.darkText,
    fontSize: 17,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
});
