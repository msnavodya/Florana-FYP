import type { ReactNode } from "react";
import { useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
  View,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";

import { colors } from "../constants/colors";

type HeaderProps = {
  greeting: string;
  onLanguagePress: () => void;
  onMenuPress: () => void;
};

function AnimatedIconButton({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
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
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function Header({ greeting, onLanguagePress, onMenuPress }: HeaderProps) {
  return (
    <View style={styles.card}>
      <View style={styles.leftBlock}>
        <View style={styles.logoWrap}>
          <Image source={require("../assets/floranalogo.jpg")} style={styles.logoImage} resizeMode="cover" />
          <View style={styles.logoFallback}>
            <Text style={styles.logoText}>FLORANA</Text>
          </View>
        </View>
      </View>

      <View style={styles.centerBlock}>
        <Text numberOfLines={1} style={styles.greeting}>
          {greeting} {"\uD83C\uDF31"}
        </Text>
      </View>

      <View style={styles.rightBlock}>
        <AnimatedIconButton onPress={onLanguagePress}>
          <View style={styles.languageButton}>
            <MaterialIcons name="translate" size={20} color={colors.darkText} />
          </View>
        </AnimatedIconButton>

        <AnimatedIconButton onPress={onMenuPress}>
          <View style={styles.menuButton}>
            <Feather name="menu" size={22} color={colors.white} />
          </View>
        </AnimatedIconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.secondarySoft,
    borderRadius: 22,
    flexDirection: "row",
    minHeight: 95,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  leftBlock: {
    marginRight: 12,
  },
  logoWrap: {
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 35,
    borderWidth: 2,
    height: 70,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    width: 70,
  },
  logoImage: {
    height: "100%",
    position: "absolute",
    width: "100%",
  },
  logoFallback: {
    alignItems: "center",
    backgroundColor: colors.primary,
    flex: 1,
    justifyContent: "center",
    opacity: 0,
  },
  logoText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
  },
  greeting: {
    color: colors.darkText,
    fontSize: 22,
    fontWeight: "700",
  },
  rightBlock: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginLeft: 12,
  },
  languageButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: 40,
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    width: 42,
  },
});
