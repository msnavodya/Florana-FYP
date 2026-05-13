// Render the mobile Quick Tip screen.
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { LanguageSelector } from "../components/LanguageSelector";
import { Screen } from "../components/Screen";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { storageKeys } from "../lib/storage/keys";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

const tipOptions = [
  { key: "soil" },
  { key: "sunlight" },
  { key: "watering" },
  { key: "fertilizer" },
  { key: "pest" },
  { key: "seasonal" },
  { key: "diy" },
  { key: "pairing" },
] as const;

type QuickTipKey = (typeof tipOptions)[number]["key"];
type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type StoredUser = {
  id?: string;
  _id?: string;
  full_name?: string;
  name?: string;
  email?: string;
};

type CommunityComment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  senderId?: string;
  mine?: boolean;
};

type CommunityPost = {
  id: string;
  author: string;
  title: string;
  body: string;
  tag: string;
  likes: number;
  liked: boolean;
  comments: CommunityComment[];
  createdAt: string;
  senderId?: string;
  mine?: boolean;
};

type ChatMessage = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  senderId?: string;
  mine?: boolean;
};

const COMMUNITY_POSTS_KEY = "florana.quicktip.community.posts";
const COMMUNITY_CHAT_KEY = "florana.quicktip.community.chat";
const COMMUNITY_CHAT_RESET_KEY = "florana.quicktip.community.chat.reset.v1";

function buildRecentTimestamp(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

function isCurrentUserAlias(author: string | undefined, translatedYouLabel: string) {
  if (!author) {
    return false;
  }

  const normalized = author.trim().toLowerCase();
  return normalized === translatedYouLabel.trim().toLowerCase() || normalized === "you";
}

function resolveSenderName(author: string | undefined, fallbackAuthor: string, translatedYouLabel: string) {
  const trimmedAuthor = author?.trim();
  if (trimmedAuthor && !isCurrentUserAlias(trimmedAuthor, translatedYouLabel)) {
    return trimmedAuthor;
  }

  return fallbackAuthor.trim();
}

function resolveMineState(
  senderId: string | undefined,
  mine: boolean | undefined,
  author: string | undefined,
  fallbackAuthor: string,
  currentSenderId: string,
  currentUserName: string,
  translatedYouLabel: string
) {
  const trimmedSenderId = senderId?.trim();
  if (trimmedSenderId) {
    return trimmedSenderId === currentSenderId;
  }

  if (!mine) {
    return false;
  }

  return resolveSenderName(author, fallbackAuthor, translatedYouLabel) === currentUserName;
}

function buildInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "FG";
}

function formatRelativeTime(value: string | undefined, t: TranslateFn) {
  if (!value) {
    return t("just_now");
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return t("just_now");
  }

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / (60 * 1000)));
  if (minutes < 1) {
    return t("just_now");
  }

  if (minutes < 60) {
    return t("min_ago", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t("hr_ago", { count: hours });
  }

  return t("day_ago", { count: Math.floor(hours / 24) });
}

function buildCommunityComment(
  message: string,
  author: string,
  fallbackId: string,
  mine = false,
  createdAt = buildRecentTimestamp(0)
): CommunityComment {
  return {
    id: fallbackId,
    author,
    message,
    createdAt,
    mine,
  };
}

function normalizeCommunityComment(
  comment: CommunityComment | string,
  fallbackAuthor: string,
  fallbackId: string,
  currentSenderId: string,
  currentUserName: string,
  translatedYouLabel: string
): CommunityComment {
  if (typeof comment === "string") {
    return buildCommunityComment(comment, resolveSenderName(undefined, fallbackAuthor, translatedYouLabel), fallbackId);
  }

  return {
    id: comment.id || fallbackId,
    author: resolveSenderName(comment.author, comment.mine ? fallbackAuthor : comment.author || fallbackAuthor, translatedYouLabel),
    message: comment.message || "",
    createdAt: comment.createdAt || buildRecentTimestamp(0),
    senderId: comment.senderId,
    mine: resolveMineState(
      comment.senderId,
      comment.mine,
      comment.author,
      fallbackAuthor,
      currentSenderId,
      currentUserName,
      translatedYouLabel
    ),
  };
}

function localizeStarterPosts(
  savedPosts: CommunityPost[],
  localizedStarterPosts: CommunityPost[],
  currentSenderId: string,
  currentUserName: string,
  translatedYouLabel: string
) {
  return savedPosts.map((post) => {
    const starterPost = localizedStarterPosts.find((item) => item.id === post.id);
    const postFallbackAuthor = post.author?.trim() || (starterPost?.author ?? currentUserName);
    const savedComments = Array.isArray(post.comments) ? post.comments : [];
    const normalizedComments = savedComments.map((comment, index) =>
      normalizeCommunityComment(comment, postFallbackAuthor, `${post.id}-comment-${index}`, currentSenderId, currentUserName, translatedYouLabel)
    );

    if (!starterPost) {
      return {
        ...post,
        author: resolveSenderName(post.author, postFallbackAuthor, translatedYouLabel),
        comments: normalizedComments,
        likes: Number.isFinite(post.likes) ? post.likes : 0,
        liked: Boolean(post.liked),
        createdAt: post.createdAt || buildRecentTimestamp(0),
        senderId: post.senderId,
        mine: resolveMineState(
          post.senderId,
          post.mine,
          post.author,
          postFallbackAuthor,
          currentSenderId,
          currentUserName,
          translatedYouLabel
        ),
      };
    }

    const starterComments = starterPost.comments.map((comment, index) =>
      normalizeCommunityComment(comment, starterPost.author, `${starterPost.id}-starter-${index}`, currentSenderId, currentUserName, translatedYouLabel)
    );
    const extraComments = normalizedComments.slice(starterComments.length);

    return {
      ...post,
      author: resolveSenderName(post.author, postFallbackAuthor, translatedYouLabel),
      title: starterPost.title,
      body: starterPost.body,
      tag: post.tag || starterPost.tag,
      comments: [...starterComments, ...extraComments],
      likes: Number.isFinite(post.likes) ? post.likes : starterPost.likes,
      liked: Boolean(post.liked),
      createdAt: post.createdAt || starterPost.createdAt,
      senderId: post.senderId,
      mine: resolveMineState(
        post.senderId,
        post.mine,
        post.author,
        postFallbackAuthor,
        currentSenderId,
        currentUserName,
        translatedYouLabel
      ),
    };
  });
}

function localizeStarterChat(
  savedMessages: ChatMessage[],
  localizedStarterChat: ChatMessage[],
  currentSenderId: string,
  currentUserName: string,
  translatedYouLabel: string
) {
  return savedMessages.map((message) => {
    const starterMessage = localizedStarterChat.find((item) => item.id === message.id);
    if (!starterMessage) {
      const legacyOwnMessage = !message.senderId && message.mine && isCurrentUserAlias(message.author, translatedYouLabel);
      const resolvedAuthor = legacyOwnMessage
        ? currentUserName
        : resolveSenderName(message.author, message.author?.trim() || currentUserName, translatedYouLabel);

      return {
        ...message,
        author: resolvedAuthor,
        createdAt: message.createdAt || buildRecentTimestamp(0),
        senderId: message.senderId || (legacyOwnMessage ? currentSenderId : undefined),
        mine: resolveMineState(
          message.senderId || (legacyOwnMessage ? currentSenderId : undefined),
          message.mine,
          resolvedAuthor,
          resolvedAuthor,
          currentSenderId,
          currentUserName,
          translatedYouLabel
        ),
      };
    }

    return {
      ...message,
      author: starterMessage.author,
      message: starterMessage.message,
      createdAt: message.createdAt || starterMessage.createdAt,
      mine: false,
    };
  });
}

function pruneLegacyYouMessages(savedMessages: ChatMessage[], translatedYouLabel: string) {
  return savedMessages.filter((message) => {
    const isLegacyYouMessage = isCurrentUserAlias(message.author, translatedYouLabel) && !message.senderId;
    return !isLegacyYouMessage;
  });
}

function pruneLegacyYouComments(savedPosts: CommunityPost[], translatedYouLabel: string) {
  return savedPosts.map((post) => ({
    ...post,
    comments: (Array.isArray(post.comments) ? post.comments : []).filter((comment) => {
      if (typeof comment === "string") {
        return true;
      }

      const isLegacyYouComment = isCurrentUserAlias(comment.author, translatedYouLabel) && !comment.senderId;
      return !isLegacyYouComment;
    }),
  }));
}

export function QuickTipScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;

  const { user } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);
  const [activeTipKey, setActiveTipKey] = useState<QuickTipKey>("soil");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaBody, setIdeaBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const translatedYouLabel = t("quick_tip_author_you");

  useEffect(() => {
    let active = true;

    const loadStoredUser = async () => {
      try {
        const userRaw = await AsyncStorage.getItem(storageKeys.user);
        if (!active || !userRaw) {
          return;
        }

        setStoredUser(JSON.parse(userRaw) as StoredUser);
      } catch {
        if (active) {
          setStoredUser(null);
        }
      }
    };

    void loadStoredUser();

    return () => {
      active = false;
    };
  }, []);

  const currentUserName = useMemo(() => {
    const possibleNames = [
      user?.full_name,
      storedUser?.full_name,
      storedUser?.name,
      user?.email?.split("@")[0],
      storedUser?.email?.split("@")[0],
    ];

    const match = possibleNames.find((item) => item?.trim());
    return match?.trim() || t("guest_gardener");
  }, [storedUser?.email, storedUser?.full_name, storedUser?.name, t, user?.email, user?.full_name]);

  const currentSenderId = useMemo(() => {
    const possibleIds = [
      user?.id,
      user?._id,
      storedUser?.id,
      storedUser?._id,
      user?.email,
      storedUser?.email,
      currentUserName,
    ];

    const match = possibleIds.find((item) => `${item ?? ""}`.trim());
    return `${match ?? currentUserName}`.trim();
  }, [currentUserName, storedUser?._id, storedUser?.email, storedUser?.id, user?._id, user?.email, user?.id]);

  const translatedTips = useMemo(
    () =>
      tipOptions.map((item) => ({
        key: item.key,
        title: t(`quick_tip_topic_${item.key}_title`),
        tip: t(`quick_tip_topic_${item.key}_tip`),
        detail: t(`quick_tip_topic_${item.key}_detail`),
      })),
    [t]
  );

  const starterPosts = useMemo<CommunityPost[]>(
    () => [
      {
        id: "seed-swap",
        author: t("quick_tip_author_team"),
        title: t("quick_tip_post_seed_title"),
        body: t("quick_tip_post_seed_body"),
        tag: t("quick_tip_tag_share_seeds"),
        likes: 8,
        liked: false,
        comments: [
          buildCommunityComment(t("quick_tip_post_seed_comment_1"), t("quick_tip_author_friend"), "seed-swap-comment-1", false, buildRecentTimestamp(180)),
          buildCommunityComment(t("quick_tip_post_seed_comment_2"), t("quick_tip_author_team"), "seed-swap-comment-2", false, buildRecentTimestamp(120)),
        ],
        createdAt: buildRecentTimestamp(240),
        mine: false,
      },
      {
        id: "watering-tip",
        author: t("quick_tip_author_friend"),
        title: t("quick_tip_post_watering_title"),
        body: t("quick_tip_post_watering_body"),
        tag: t("quick_tip_tag_discuss_tips"),
        likes: 5,
        liked: false,
        comments: [
          buildCommunityComment(t("quick_tip_post_watering_comment_1"), t("quick_tip_author_friend"), "watering-tip-comment-1", false, buildRecentTimestamp(95)),
          buildCommunityComment(t("quick_tip_post_watering_comment_2"), t("quick_tip_author_team"), "watering-tip-comment-2", false, buildRecentTimestamp(70)),
        ],
        createdAt: buildRecentTimestamp(140),
        mine: false,
      },
    ],
    [t]
  );

  const starterChat = useMemo<ChatMessage[]>(
    () => [
      {
        id: "welcome",
        author: t("quick_tip_author_team"),
        message: t("quick_tip_chat_welcome"),
        createdAt: buildRecentTimestamp(30),
        mine: false,
      },
    ],
    [t]
  );

  const activeTip = useMemo(
    () => translatedTips.find((item) => item.key === activeTipKey) || translatedTips[0],
    [activeTipKey, translatedTips]
  );

  useEffect(() => {
    let mounted = true;

    const loadCommunity = async () => {
      try {
        const [savedPosts, savedChat, chatResetDone] = await Promise.all([
          AsyncStorage.getItem(COMMUNITY_POSTS_KEY),
          AsyncStorage.getItem(COMMUNITY_CHAT_KEY),
          AsyncStorage.getItem(COMMUNITY_CHAT_RESET_KEY),
        ]);

        if (!mounted) {
          return;
        }

        if (savedPosts) {
          const parsedPosts = JSON.parse(savedPosts) as CommunityPost[];
          const prunedPosts = pruneLegacyYouComments(parsedPosts, translatedYouLabel);
          const normalizedPosts = localizeStarterPosts(
            prunedPosts,
            starterPosts,
            currentSenderId,
            currentUserName,
            translatedYouLabel
          );
          setPosts(normalizedPosts);
          const normalizedPostsRaw = JSON.stringify(normalizedPosts);
          if (normalizedPostsRaw !== savedPosts) {
            await AsyncStorage.setItem(COMMUNITY_POSTS_KEY, normalizedPostsRaw);
          }
        } else {
          setPosts(starterPosts);
        }

        if (savedChat) {
          if (!chatResetDone) {
            setChatMessages(starterChat);
            await Promise.all([
              AsyncStorage.setItem(COMMUNITY_CHAT_KEY, JSON.stringify(starterChat)),
              AsyncStorage.setItem(COMMUNITY_CHAT_RESET_KEY, "done"),
            ]);
            return;
          }

          const parsedChat = JSON.parse(savedChat) as ChatMessage[];
          const prunedChat = pruneLegacyYouMessages(parsedChat, translatedYouLabel);
          const normalizedChat = localizeStarterChat(
            prunedChat,
            starterChat,
            currentSenderId,
            currentUserName,
            translatedYouLabel
          );
          setChatMessages(normalizedChat);
          const normalizedChatRaw = JSON.stringify(normalizedChat);
          if (normalizedChatRaw !== savedChat) {
            await AsyncStorage.setItem(COMMUNITY_CHAT_KEY, normalizedChatRaw);
          }
        } else {
          setChatMessages(starterChat);
        }
      } catch {
        if (mounted) {
          setPosts(starterPosts);
          setChatMessages(starterChat);
        }
      }
    };

    void loadCommunity();

    return () => {
      mounted = false;
    };
  }, [currentSenderId, currentUserName, starterChat, starterPosts, translatedYouLabel]);

  useEffect(() => {
    setPosts((current) => localizeStarterPosts(current, starterPosts, currentSenderId, currentUserName, translatedYouLabel));
    setChatMessages((current) => localizeStarterChat(current, starterChat, currentSenderId, currentUserName, translatedYouLabel));
  }, [currentSenderId, currentUserName, starterChat, starterPosts, translatedYouLabel]);

  const persistPosts = async (nextPosts: CommunityPost[]) => {
    setPosts(nextPosts);
    await AsyncStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(nextPosts));
  };

  const persistChat = async (nextMessages: ChatMessage[]) => {
    setChatMessages(nextMessages);
    await AsyncStorage.setItem(COMMUNITY_CHAT_KEY, JSON.stringify(nextMessages));
  };

  const handleAddIdea = async () => {
    const title = ideaTitle.trim();
    const body = ideaBody.trim();

    if (!title || !body) {
      Alert.alert(t("quick_tip_add_idea_title"), t("quick_tip_add_idea_alert"));
      return;
    }

    const nextPost: CommunityPost = {
      id: `${Date.now()}`,
      author: currentUserName,
      title,
      body,
      tag: activeTip.title,
      likes: 0,
      liked: false,
      comments: [],
      createdAt: new Date().toISOString(),
      senderId: currentSenderId,
      mine: true,
    };

    await persistPosts([nextPost, ...posts]);
    setIdeaTitle("");
    setIdeaBody("");
  };

  const handleToggleLike = async (postId: string) => {
    const nextPosts = posts.map((post) => {
      if (post.id !== postId) {
        return post;
      }

      const liked = !post.liked;
      return {
        ...post,
        liked,
        likes: Math.max(0, post.likes + (liked ? 1 : -1)),
      };
    });

    await persistPosts(nextPosts);
  };

  const handleAddComment = async (postId: string) => {
    const comment = (commentDrafts[postId] || "").trim();
    if (!comment) {
      return;
    }

    const nextPosts = posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: [
              ...post.comments,
              {
                id: `${postId}-${Date.now()}`,
                author: currentUserName,
                message: comment,
                createdAt: new Date().toISOString(),
                senderId: currentSenderId,
                mine: true,
              },
            ],
          }
        : post
    );

    await persistPosts(nextPosts);
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  };

  const handleDeletePost = async (postId: string) => {
    await persistPosts(posts.filter((post) => post.id !== postId));
    setCommentDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[postId];
      return nextDrafts;
    });
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const nextPosts = posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: post.comments.filter((comment) => comment.id !== commentId),
          }
        : post
    );

    await persistPosts(nextPosts);
  };

  const handleSendChat = async () => {
    const message = chatDraft.trim();
    if (!message) {
      return;
    }

    const nextMessage: ChatMessage = {
      id: `${Date.now()}`,
      author: currentUserName,
      message,
      createdAt: new Date().toISOString(),
      senderId: currentSenderId,
      mine: true,
    };

    await persistChat([...chatMessages, nextMessage]);
    setChatDraft("");
  };

  const handleDeleteChatMessage = async (messageId: string) => {
    await persistChat(chatMessages.filter((message) => message.id !== messageId));
  };

  const totalComments = useMemo(
    () => posts.reduce((sum, post) => sum + post.comments.length, 0),
    [posts]
  );

  const spotlightPost = useMemo(
    () =>
      [...posts].sort((left, right) => {
        const leftScore = left.likes + left.comments.length;
        const rightScore = right.likes + right.comments.length;
        return rightScore - leftScore;
      })[0] || null,
    [posts]
  );

  const latestChatMessage = useMemo(
    () => chatMessages[chatMessages.length - 1] || null,
    [chatMessages]
  );

  const pulseCards = useMemo(
    () => [
      { icon: "forum" as const, value: posts.length, label: t("quick_tip_pulse_posts") },
      { icon: "comment" as const, value: totalComments, label: t("quick_tip_pulse_comments") },
      { icon: "chat" as const, value: chatMessages.length, label: t("quick_tip_pulse_messages") },
    ],
    [chatMessages.length, posts.length, t, totalComments]
  );

  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.topBar, compact ? styles.topBarCompact : null]}>
        <Pressable accessibilityLabel={t("back")} onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.topBarActions}>
          <LanguageSelector />

          <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
        <Text style={styles.heroEyebrow}>{t("quick_tip_card")}</Text>
        <Text style={styles.heroTitle}>{t("quick_tip_community_title")}</Text>
        <Text style={styles.heroSubtitle}>{t("quick_tip_community_subtitle")}</Text>

        <View style={styles.heroPills}>
          <View style={styles.heroPill}>
            <MaterialIcons name="person" size={16} color={colors.white} />
            <Text style={styles.heroPillText}>{t("quick_tip_share_as", { name: currentUserName })}</Text>
          </View>
          <View style={styles.heroPill}>
            <MaterialIcons name="lightbulb" size={16} color={colors.white} />
            <Text style={styles.heroPillText}>{activeTip.title}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tipsList}>
        {tipOptions.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setActiveTipKey(option.key)}
            style={[styles.tipChip, activeTipKey === option.key ? styles.tipChipActive : null]}
          >
            <Text style={[styles.tipChipText, activeTipKey === option.key ? styles.tipChipTextActive : null]}>
              {t(`quick_tip_topic_${option.key}_title`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.spotlightCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.communityTitleRow}>
            <MaterialIcons name="auto-awesome" size={20} color={colors.primaryDark} />
            <Text style={styles.sectionTitle}>{t("quick_tip_spotlight_title")}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{t("quick_tip_spotlight_subtitle")}</Text>
        </View>

        <View style={styles.tipDetailBox}>
          <View style={styles.tipDetailHeader}>
            <MaterialIcons name="lightbulb" size={18} color={colors.primaryDark} />
            <Text style={styles.tipDetailTitle}>{activeTip.title}</Text>
          </View>
          <Text style={styles.topicEyebrow}>{t("quick_tip_selected_topic")}</Text>
          <Text style={styles.tipText}>{activeTip.tip}</Text>
          <Text style={styles.tipDetails}>{activeTip.detail}</Text>
        </View>

        <View style={styles.pulseGrid}>
          {pulseCards.map((card) => (
            <View key={card.label} style={styles.pulseCard}>
              <MaterialIcons name={card.icon} size={18} color={colors.primaryDark} />
              <Text style={styles.pulseValue}>{card.value}</Text>
              <Text style={styles.pulseLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.highlightStack}>
          {spotlightPost ? (
            <View style={styles.highlightCard}>
              <View style={styles.highlightHeader}>
                <MaterialIcons name="trending-up" size={18} color={colors.primaryDark} />
                <Text style={styles.highlightTitle}>{t("quick_tip_trending_title")}</Text>
              </View>
              <Text style={styles.highlightMeta}>
                {spotlightPost.author} · {formatRelativeTime(spotlightPost.createdAt, t)}
              </Text>
              <Text style={styles.highlightBodyTitle}>{spotlightPost.title}</Text>
              <Text numberOfLines={3} style={styles.highlightBody}>
                {spotlightPost.body}
              </Text>
            </View>
          ) : null}

          {latestChatMessage ? (
            <View style={styles.highlightCard}>
              <View style={styles.highlightHeader}>
                <MaterialIcons name="chat" size={18} color={colors.primaryDark} />
                <Text style={styles.highlightTitle}>{t("quick_tip_latest_message_title")}</Text>
              </View>
              <Text style={styles.highlightMeta}>
                {latestChatMessage.author} · {formatRelativeTime(latestChatMessage.createdAt, t)}
              </Text>
              <Text numberOfLines={3} style={styles.highlightBody}>
                {latestChatMessage.message}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Pressable onPress={() => router.push("/care")} style={styles.bottomButton}>
        <Text style={styles.bottomButtonText}>{t("open_care_reminder")}</Text>
      </Pressable>

      <View style={styles.communityHeader}>
        <View style={styles.communityTitleRow}>
          <MaterialIcons name="forum" size={20} color={colors.primaryDark} />
          <Text style={styles.sectionTitle}>{t("quick_tip_community_section")}</Text>
        </View>
        <Text style={styles.sectionSubtitle}>{t("quick_tip_community_section_subtitle")}</Text>
        <View style={styles.communityMemberPill}>
          <MaterialIcons name="person" size={16} color={colors.primaryDark} />
          <Text style={styles.communityMemberText}>{currentUserName}</Text>
        </View>
      </View>

      <View style={styles.ideaComposer}>
        <Text style={styles.composerTitle}>{t("quick_tip_add_idea_title")}</Text>
        <Text style={styles.composerMeta}>{t("quick_tip_share_as", { name: currentUserName })}</Text>

        <View style={styles.selectedTopicPill}>
          <MaterialIcons name="sell" size={15} color={colors.primaryDark} />
          <Text style={styles.selectedTopicText}>{activeTip.title}</Text>
        </View>

        <TextInput
          value={ideaTitle}
          onChangeText={setIdeaTitle}
          placeholder={t("quick_tip_add_idea_placeholder_title")}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <TextInput
          value={ideaBody}
          onChangeText={setIdeaBody}
          multiline
          placeholder={t("quick_tip_add_idea_placeholder_body")}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.ideaInput]}
        />
        <Pressable onPress={() => void handleAddIdea()} style={styles.postButton}>
          <MaterialIcons name="add-circle-outline" size={18} color={colors.white} />
          <Text style={styles.postButtonText}>{t("quick_tip_post_idea")}</Text>
        </Pressable>
      </View>

      <View style={styles.postList}>
        {posts.map((post) => (
          <View key={post.id} style={styles.communityPost}>
            <View style={styles.postTopRow}>
              <View style={styles.postAvatar}>
                <Text style={styles.postAvatarText}>{buildInitials(post.author)}</Text>
              </View>

              <View style={styles.postTitleBlock}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postMeta}>{post.author}</Text>
                <Text style={styles.postMetaDetail}>
                  {post.tag} · {formatRelativeTime(post.createdAt, t)}
                </Text>
              </View>

              {post.mine ? (
                <Pressable
                  accessibilityLabel={t("delete")}
                  onPress={() =>
                    Alert.alert(t("delete"), post.title, [
                      { text: t("cancel"), style: "cancel" },
                      { text: t("delete"), style: "destructive", onPress: () => void handleDeletePost(post.id) },
                    ])
                  }
                  style={styles.inlineDeleteButton}
                >
                  <MaterialIcons name="delete-outline" size={18} color="#B33D68" />
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.postBody}>{post.body}</Text>

            <View style={styles.postActions}>
              <Pressable onPress={() => void handleToggleLike(post.id)} style={styles.actionButton}>
                <MaterialIcons
                  name={post.liked ? "favorite" : "favorite-border"}
                  size={18}
                  color={post.liked ? "#D9486E" : colors.textMuted}
                />
                <Text style={styles.actionText}>{post.likes}</Text>
              </Pressable>

              <View style={styles.actionButton}>
                <MaterialIcons name="comment" size={18} color={colors.textMuted} />
                <Text style={styles.actionText}>{post.comments.length}</Text>
              </View>
            </View>

            {post.comments.length > 0 ? (
              <View style={styles.commentList}>
                {post.comments.map((comment, index) => (
                  <View key={comment.id || `${post.id}-${index}`} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentMetaRow}>
                        <Text style={styles.commentAuthor}>{comment.author}</Text>
                        <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt, t)}</Text>
                      </View>
                      {comment.mine ? (
                        <Pressable
                          accessibilityLabel={t("delete")}
                          onPress={() =>
                            Alert.alert(t("delete"), comment.message, [
                              { text: t("cancel"), style: "cancel" },
                              {
                                text: t("delete"),
                                style: "destructive",
                                onPress: () => void handleDeleteComment(post.id, comment.id),
                              },
                            ])
                          }
                          style={styles.commentDeleteButton}
                        >
                          <MaterialIcons name="delete-outline" size={16} color="#B33D68" />
                        </Pressable>
                      ) : null}
                    </View>
                    <Text style={styles.commentText}>{comment.message}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.commentComposer}>
              <TextInput
                value={commentDrafts[post.id] || ""}
                onChangeText={(value) => setCommentDrafts((current) => ({ ...current, [post.id]: value }))}
                placeholder={t("quick_tip_add_comment")}
                placeholderTextColor={colors.textMuted}
                style={styles.commentInput}
              />
              <Pressable onPress={() => void handleAddComment(post.id)} style={styles.commentSendButton}>
                <MaterialIcons name="send" size={16} color={colors.white} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

        <View style={styles.chatBox}>
        <View style={styles.sectionHeader}>
          <View style={styles.communityTitleRow}>
            <MaterialIcons name="chat" size={20} color={colors.primaryDark} />
            <Text style={styles.sectionTitle}>{t("quick_tip_chat_section")}</Text>
          </View>
          <Text style={[styles.sectionSubtitle, styles.chatSubtitle]}>{t("quick_tip_chat_welcome")}</Text>
        </View>

        <View style={styles.chatMessages}>
          {chatMessages.slice(-6).map((item) => (
            <View key={item.id} style={[styles.chatBubble, item.mine ? styles.chatBubbleMine : null]}>
              <View style={styles.chatHeader}>
                <View style={styles.chatMetaRow}>
                  <Text style={styles.chatAuthor}>{item.author}</Text>
                  <Text style={styles.chatTime}>{formatRelativeTime(item.createdAt, t)}</Text>
                </View>
                {item.mine ? (
                  <Pressable
                    accessibilityLabel={t("delete")}
                    onPress={() =>
                      Alert.alert(t("delete"), item.message, [
                        { text: t("cancel"), style: "cancel" },
                        { text: t("delete"), style: "destructive", onPress: () => void handleDeleteChatMessage(item.id) },
                      ])
                    }
                    style={styles.chatDeleteButton}
                  >
                    <MaterialIcons name="delete-outline" size={16} color="#B33D68" />
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.chatText}>{item.message}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chatComposer}>
          <TextInput
            value={chatDraft}
            onChangeText={setChatDraft}
            placeholder={t("quick_tip_chat_placeholder")}
            placeholderTextColor={colors.text}
            style={styles.chatInput}
          />
          <Pressable onPress={() => void handleSendChat()} style={styles.chatSendButton}>
            <MaterialIcons name="send" size={17} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  topBarCompact: {
    alignItems: "flex-start",
  },
  topBarActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    ...shadows.soft,
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    ...shadows.soft,
  },
  heroCard: {
    backgroundColor: "#4F5FA8",
    borderRadius: 28,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroCardCompact: {
    borderRadius: 24,
    padding: spacing.md,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
  },
  heroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  heroPill: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
  },
  heroPillText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  tipsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipChip: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...shadows.soft,
  },
  tipChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  tipChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  tipChipTextActive: {
    color: colors.white,
  },
  spotlightCard: {
    backgroundColor: "rgb(207, 182, 246)",
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  communityTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: colors.surfaceMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  tipDetailBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 22,
    gap: spacing.sm,
    padding: spacing.md,
  },
  tipDetailHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  tipDetailTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  topicEyebrow: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  tipText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  tipDetails: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  pulseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pulseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    minWidth: 92,
    padding: spacing.md,
  },
  pulseValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  pulseLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  highlightStack: {
    gap: spacing.sm,
  },
  highlightCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  highlightHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  highlightTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  highlightMeta: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  highlightBodyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  highlightBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  bottomButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    justifyContent: "center",
    marginBottom: spacing.md,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    ...shadows.soft,
  },
  bottomButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  communityHeader: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  communityMemberPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  communityMemberText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
  },
  ideaComposer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  composerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  composerMeta: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
  },
  selectedTopicPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  selectedTopicText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ideaInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  postButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  postButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  postList: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  communityPost: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  postTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  postAvatar: {
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  postAvatarText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  postTitleBlock: {
    flex: 1,
  },
  inlineDeleteButton: {
    alignItems: "center",
    backgroundColor: "#FFF1F5",
    borderRadius: 14,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  postTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  postMeta: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  postMetaDetail: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  postBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  postActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  commentList: {
    gap: 6,
  },
  commentCard: {
    backgroundColor: "#F8F4FF",
    borderRadius: 14,
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  commentHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  commentMetaRow: {
    flex: 1,
    marginRight: spacing.sm,
  },
  commentAuthor: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  commentTime: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  commentDeleteButton: {
    alignItems: "center",
    backgroundColor: "#FFF1F5",
    borderRadius: 12,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  commentText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  commentComposer: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  commentInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  commentSendButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 15,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  chatBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  chatSubtitle: {
    color: colors.text,
  },
  chatMessages: {
    gap: spacing.sm,
  },
  chatBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    gap: 4,
    maxWidth: "94%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chatBubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: colors.accentSoft,
  },
  chatHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chatMetaRow: {
    flex: 1,
    marginRight: spacing.sm,
  },
  chatAuthor: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
  },
  chatTime: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: spacing.md,
  },
  chatDeleteButton: {
    alignItems: "center",
    backgroundColor: "#FFF1F5",
    borderRadius: 12,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  chatText: {
    color: "#000000",
    fontSize: 14,
    lineHeight: 20,
  },
  chatComposer: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  chatInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: "#000000",
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  chatSendButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
});
