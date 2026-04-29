import { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "../constants/colors";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  placeholder: string;
};

export function SearchBar({
  value,
  onChangeText,
  onSearch,
  placeholder,
}: SearchBarProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
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
    <View style={styles.row}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
      />

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onSearch} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.button}>
          <Text style={styles.buttonText}>Search</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 18,
    color: colors.darkText,
    flex: 1,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 18,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
