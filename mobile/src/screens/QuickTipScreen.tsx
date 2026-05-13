// Render the mobile Quick Tip screen.
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { Screen } from "../components/Screen";
import { useLanguage } from "../context/LanguageContext";
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

type CommunityPost = {
  id: string;
  author: string;
  title: string;
  body: string;
  tag: string;
  likes: number;
  liked: boolean;
  comments: string[];
  mine?: boolean;
};

type ChatMessage = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  mine?: boolean;
};

const COMMUNITY_POSTS_KEY = "florana.quicktip.community.posts";
const COMMUNITY_CHAT_KEY = "florana.quicktip.community.chat";

function localizeStarterPosts(savedPosts: CommunityPost[], localizedStarterPosts: CommunityPost[]) {
  return savedPosts.map((post) => {
    const starterPost = localizedStarterPosts.find((item) => item.id === post.id);
    if (!starterPost) {
      return post;
    }

    const extraComments = post.comments.slice(starterPost.comments.length);
    return {
      ...post,
      author: starterPost.author,
      title: starterPost.title,
      body: starterPost.body,
      tag: starterPost.tag,
      comments: [...starterPost.comments, ...extraComments],
      mine: false,
    };
  });
}

function localizeStarterChat(savedMessages: ChatMessage[], localizedStarterChat: ChatMessage[]) {
  return savedMessages.map((message) => {
    const starterMessage = localizedStarterChat.find((item) => item.id === message.id);
    if (!starterMessage) {
      return message;
    }

    return {
      ...message,
      author: starterMessage.author,
      message: starterMessage.message,
      mine: false,
    };
  });
}

export function QuickTipScreen() {
  // Tighten the layout a bit on smaller screens so the long community sections remain readable.
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;

  // Screen state for tips, community posts, and the lightweight local chat.
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTipKey, setActiveTipKey] = useState<(typeof tipOptions)[number]["key"]>("soil");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaBody, setIdeaBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");

  const translatedTips = useMemo(
    // Build the quick-tip picker from translation keys so each topic switches language with the app.
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
    // Seed the community feed with localized starter content for first-time users.
    () => [
      {
        id: "seed-swap",
        author: t("quick_tip_author_team"),
        title: t("quick_tip_post_seed_title"),
        body: t("quick_tip_post_seed_body"),
        tag: t("quick_tip_tag_share_seeds"),
        likes: 8,
        liked: false,
        comments: [t("quick_tip_post_seed_comment_1"), t("quick_tip_post_seed_comment_2")],
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
        comments: [t("quick_tip_post_watering_comment_1"), t("quick_tip_post_watering_comment_2")],
        mine: false,
      },
    ],
    [t]
  );

  const starterChat = useMemo<ChatMessage[]>(
    // Keep a default welcome message so the chat area never renders empty on first load.
    () => [
      {
        id: "welcome",
        author: "Florana",
        message: t("quick_tip_chat_welcome"),
        createdAt: new Date().toISOString(),
        mine: false,
      },
    ],
    [t]
  );

  // Read the currently selected quick-tip topic from the localized list.
  const activeTip = useMemo(
    () => translatedTips.find((item) => item.key === activeTipKey) || translatedTips[0],
    [activeTipKey, translatedTips]
  );

  useEffect(() => {
    let mounted = true;

    // Load locally saved community content, then fall back to starter examples if needed.
    const loadCommunity = async () => {
      try {
        const [savedPosts, savedChat] = await Promise.all([
          AsyncStorage.getItem(COMMUNITY_POSTS_KEY),
          AsyncStorage.getItem(COMMUNITY_CHAT_KEY),
        ]);

        if (!mounted) {
          return;
        }

        if (savedPosts) {
          setPosts(localizeStarterPosts(JSON.parse(savedPosts) as CommunityPost[], starterPosts));
        } else {
          setPosts(starterPosts);
        }

        if (savedChat) {
          setChatMessages(localizeStarterChat(JSON.parse(savedChat) as ChatMessage[], starterChat));
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
  }, [starterChat, starterPosts]);

  const persistPosts = async (nextPosts: CommunityPost[]) => {
    // Save updates immediately so likes, comments, and new ideas survive app restarts.
    setPosts(nextPosts);
    await AsyncStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(nextPosts));
  };

  const persistChat = async (nextMessages: ChatMessage[]) => {
    // Store the lightweight local chat history alongside the rendered state.
    setChatMessages(nextMessages);
    await AsyncStorage.setItem(COMMUNITY_CHAT_KEY, JSON.stringify(nextMessages));
  };

  // Refresh starter content translations without wiping user-created posts or messages.
  useEffect(() => {
    setPosts((current) => localizeStarterPosts(current, starterPosts));
    setChatMessages((current) => localizeStarterChat(current, starterChat));
  }, [starterChat, starterPosts]);

  // Add a new community idea card to the local feed.
  const handleAddIdea = async () => {
    const title = ideaTitle.trim();
    const body = ideaBody.trim();

    if (!title || !body) {
      Alert.alert(t("quick_tip_add_idea_title"), t("quick_tip_add_idea_alert"));
      return;
    }

    const nextPost: CommunityPost = {
      id: `${Date.now()}`,
      author: t("quick_tip_author_you"),
      title,
      body,
      tag: title.toLowerCase().includes("seed") ? t("quick_tip_tag_share_seeds") : t("quick_tip_tag_care_idea"),
      likes: 0,
      liked: false,
      comments: [],
      mine: true,
    };

    await persistPosts([nextPost, ...posts]);
    setIdeaTitle("");
    setIdeaBody("");
  };

  const handleToggleLike = async (postId: string) => {
    // Keep likes fully local for now by updating the stored post collection in place.
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
      post.id === postId ? { ...post, comments: [...post.comments, comment] } : post
    );

    await persistPosts(nextPosts);
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  };

  const handleSendChat = async () => {
    const message = chatDraft.trim();
    if (!message) {
      return;
    }

    const nextMessage: ChatMessage = {
      id: `${Date.now()}`,
      author: t("quick_tip_author_you"),
      message,
      createdAt: new Date().toISOString(),
      mine: true,
    };

    await persistChat([...chatMessages, nextMessage]);
    setChatDraft("");
  };

  // Render the mobile Quick Tip screen and its main interactive sections.
  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.topBar, compact ? styles.topBarCompact : null]}>
        <Pressable accessibilityLabel={t("back")} onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
          <MaterialIcons name="menu" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
        <Text style={styles.heroEyebrow}>{t("quick_tip_card")}</Text>
        <Text style={styles.heroTitle}>{t("quick_tip_community_title")}</Text>
        <Text style={styles.heroSubtitle}>{t("quick_tip_community_subtitle")}</Text>
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

      <View style={styles.tipDetailBox}>
        <View style={styles.tipDetailHeader}>
          <MaterialIcons name="lightbulb" size={18} color={colors.primaryDark} />
          <Text style={styles.tipDetailTitle}>{activeTip.title}</Text>
        </View>
        <Text style={styles.tipText}>{activeTip.tip}</Text>
        <Text style={styles.tipDetails}>{activeTip.detail}</Text>
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
      </View>

      <View style={styles.ideaComposer}>
        <Text style={styles.composerTitle}>{t("quick_tip_add_idea_title")}</Text>
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
                <MaterialIcons name="local-florist" size={18} color={colors.white} />
              </View>
              <View style={styles.postTitleBlock}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postMeta}>{post.mine ? t("quick_tip_author_you") : post.author} - {post.tag}</Text>
              </View>
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
                  <Text key={`${post.id}-${index}`} style={styles.commentText}>{comment}</Text>
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
        <View style={styles.communityTitleRow}>
          <MaterialIcons name="chat" size={20} color={colors.primaryDark} />
          <Text style={styles.sectionTitle}>{t("quick_tip_chat_section")}</Text>
        </View>

        <View style={styles.chatMessages}>
          {chatMessages.slice(-5).map((item) => (
            <View key={item.id} style={[styles.chatBubble, item.mine ? styles.chatBubbleMine : null]}>
              <Text style={styles.chatAuthor}>{item.mine ? t("quick_tip_author_you") : item.author}</Text>
              <Text style={styles.chatText}>{item.message}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chatComposer}>
          <TextInput
            value={chatDraft}
            onChangeText={setChatDraft}
            placeholder={t("quick_tip_chat_placeholder")}
            placeholderTextColor={colors.textMuted}
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
  // Header controls.
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  topBarCompact: {
    alignItems: "flex-start",
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

  // Hero and topic chips.
  heroCard: {
    backgroundColor: "#4F5FA8",
    borderRadius: 28,
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
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.xs,
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

  // Tip detail card and shortcut button.
  tipDetailBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
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

  // Community feed heading and composer.
  communityHeader: {
    gap: spacing.xs,
    marginBottom: spacing.md,
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

  // Community post cards, comments, and reactions.
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
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  postTitleBlock: {
    flex: 1,
  },
  postTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  postMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
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
  commentText: {
    backgroundColor: "#F8F4FF",
    borderRadius: 14,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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

  // Local chat area.
  chatBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  chatMessages: {
    gap: spacing.sm,
  },
  chatBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    maxWidth: "92%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chatBubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: colors.accentSoft,
  },
  chatAuthor: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 2,
  },
  chatText: {
    color: colors.text,
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
    color: colors.text,
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
