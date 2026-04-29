import type { ComponentProps } from "react";
import { useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { colors } from "../constants/colors";

type Review = {
  id: string;
  message: string;
  rating: number;
  time: string;
};

type FeedbackCarouselProps = {
  reviews: Review[];
  activeIndex: number;
  onNext: () => void;
  onPrev: () => void;
};

function NavButton({
  icon,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.93,
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
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable style={styles.navButton} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Ionicons name={icon} size={20} color={colors.white} />
      </Pressable>
    </Animated.View>
  );
}

export function FeedbackCarousel({
  reviews,
  activeIndex,
  onNext,
  onPrev,
}: FeedbackCarouselProps) {
  const activeReview = useMemo(() => reviews[activeIndex] ?? reviews[0], [activeIndex, reviews]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>User Feedback</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{`${activeIndex + 1}/${reviews.length}`}</Text>
        </View>
      </View>

      <View style={styles.middleRow}>
        <NavButton icon="arrow-back" onPress={onPrev} />

        <View style={styles.reviewCard}>
          <Text style={styles.reviewText}>{activeReview.message}</Text>

          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <MaterialIcons
                key={`${activeReview.id}-${index}`}
                name="star"
                size={18}
                color={index < activeReview.rating ? colors.star : colors.secondary}
              />
            ))}
          </View>

          <Text style={styles.reviewTime}>{activeReview.time}</Text>
        </View>

        <NavButton icon="arrow-forward" onPress={onNext} />
      </View>

      <View style={styles.paginationRow}>
        {reviews.map((review, index) => (
          <View
            key={review.id}
            style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondarySoft,
    borderRadius: 22,
    padding: 16,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: "800",
  },
  badge: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  middleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  navButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 44,
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    width: 44,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    flex: 1,
    minHeight: 140,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  reviewText: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
    marginBottom: 16,
    textTransform: "lowercase",
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 18,
  },
  reviewTime: {
    alignSelf: "flex-end",
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  paginationRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  dot: {
    backgroundColor: "rgba(155,109,255,0.28)",
    borderRadius: 999,
    height: 8,
    marginLeft: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
});
