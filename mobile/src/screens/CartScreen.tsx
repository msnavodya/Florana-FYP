import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useCart } from "../context/CartContext";
import { confirmPayment, createPaymentIntent, type PaymentMethod } from "../lib/api/payment";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import { formatPrice } from "../utils/shop";

const deliveryFee = 750;

export function CartScreen() {
  const { items, currency, removeItem, updateQuantity, clearCart, subtotal, totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [delivery, setDelivery] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  const summary = useMemo(() => {
    const fee = items.length > 0 ? deliveryFee : 0;
    return {
      subtotal,
      deliveryFee: fee,
      total: subtotal + fee,
    };
  }, [items.length, subtotal]);

  const canSubmit =
    delivery.name.trim().length >= 2 &&
    delivery.phone.trim().length >= 7 &&
    delivery.address.trim().length >= 6 &&
    items.length > 0;

  const checkoutItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: Number(item.price || 0),
  }));

  const handleCheckout = async () => {
    if (!canSubmit) {
      setStatus("Please complete your delivery details before checkout.");
      return;
    }

    setSubmitting(true);
    setStatus("");

    try {
      const payload = {
        amount: summary.total,
        currency,
        method: paymentMethod,
        item_count: totalItems,
        items: checkoutItems,
        delivery: {
          name: delivery.name.trim(),
          phone: delivery.phone.trim(),
          email: delivery.email.trim() || undefined,
          address: delivery.address.trim(),
          note: delivery.note.trim() || undefined,
        },
      };

      const intent = await createPaymentIntent(payload);

      const paymentStatus =
        paymentMethod === "cod"
          ? "cod_confirmed"
          : intent.provider === "stripe" && intent.payment_intent_id
            ? "requires_action"
            : "pending";

      await confirmPayment({
        ...payload,
        payment_intent_id: intent.payment_intent_id,
        status: paymentStatus,
      });

      if (paymentMethod === "cod") {
        setStatus("Order confirmed. Pay on delivery is active for this order.");
        await clearCart();
        return;
      }

      if (intent.provider === "stripe" && intent.payment_intent_id) {
        setStatus("Stripe payment intent created. Connect the Stripe mobile SDK and publishable key to complete secure in-app card payment.");
      } else {
        setStatus(intent.message);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="My Cart" subtitle="Checkout" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.heroCard}>
        <View>
          <Text style={styles.heroEyebrow}>Secure Checkout</Text>
          <Text style={styles.heroTitle}>Professional mobile ordering for your Florana store.</Text>
        </View>
        <View style={styles.heroMetrics}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Items</Text>
            <Text style={styles.metricValue}>{totalItems}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total</Text>
            <Text style={styles.metricValue}>{formatPrice(summary.total, currency)}</Text>
          </View>
        </View>
      </View>

      {status ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      {items.length > 0 ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemCopy}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{formatPrice(item.price, currency)}</Text>
              </View>
              <View style={styles.itemFooter}>
                <View style={styles.qtyRow}>
                  <Pressable onPress={() => void updateQuantity(item.id, item.quantity - 1)} style={styles.qtyButton}>
                    <Text style={styles.qtyButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <Pressable onPress={() => void updateQuantity(item.id, item.quantity + 1)} style={styles.qtyButton}>
                    <Text style={styles.qtyButtonText}>+</Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => void removeItem(item.id)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Your cart is empty.</Text>
          <Text style={styles.emptyText}>Add plants from the catalog to start a real checkout flow.</Text>
          <PrimaryButton label="Browse Catalog" onPress={() => router.push("/catalog")} variant="secondary" />
        </View>
      )}

      {items.length > 0 ? (
        <View style={styles.summaryPanel}>
          <Text style={styles.panelTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Subtotal</Text>
            <Text style={styles.summaryValueText}>{formatPrice(summary.subtotal, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery</Text>
            <Text style={styles.summaryValueText}>{formatPrice(summary.deliveryFee, currency)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalKey}>Amount due</Text>
            <Text style={styles.summaryTotalValue}>{formatPrice(summary.total, currency)}</Text>
          </View>
        </View>
      ) : null}

      {items.length > 0 && !showCheckout ? (
        <PrimaryButton label="Continue to Checkout" onPress={() => setShowCheckout(true)} />
      ) : null}

      {showCheckout && items.length > 0 ? (
        <View style={styles.checkoutCard}>
          <Text style={styles.panelTitle}>Delivery Details</Text>
          <TextInput
            onChangeText={(value) => setDelivery((current) => ({ ...current, name: value }))}
            placeholder="Full name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={delivery.name}
          />
          <TextInput
            keyboardType="phone-pad"
            onChangeText={(value) => setDelivery((current) => ({ ...current, phone: value }))}
            placeholder="Phone number"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={delivery.phone}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(value) => setDelivery((current) => ({ ...current, email: value }))}
            placeholder="Email address"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={delivery.email}
          />
          <TextInput
            multiline
            onChangeText={(value) => setDelivery((current) => ({ ...current, address: value }))}
            placeholder="Delivery address"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.inputMultiline]}
            value={delivery.address}
          />
          <TextInput
            multiline
            onChangeText={(value) => setDelivery((current) => ({ ...current, note: value }))}
            placeholder="Order note (optional)"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.inputMultiline]}
            value={delivery.note}
          />

          <Text style={styles.panelTitle}>Payment Method</Text>
          <Pressable
            onPress={() => setPaymentMethod("card")}
            style={[styles.methodCard, paymentMethod === "card" ? styles.methodCardActive : null]}
          >
            <Text style={[styles.methodTitle, paymentMethod === "card" ? styles.methodTitleActive : null]}>Card Payment</Text>
            <Text style={[styles.methodBody, paymentMethod === "card" ? styles.methodBodyActive : null]}>
              Creates a Stripe-ready payment intent for secure checkout.
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPaymentMethod("cod")}
            style={[styles.methodCard, paymentMethod === "cod" ? styles.methodCardActive : null]}
          >
            <Text style={[styles.methodTitle, paymentMethod === "cod" ? styles.methodTitleActive : null]}>Cash on Delivery</Text>
            <Text style={[styles.methodBody, paymentMethod === "cod" ? styles.methodBodyActive : null]}>
              Confirm the order now and collect payment on delivery.
            </Text>
          </Pressable>

          <PrimaryButton
            disabled={submitting}
            label={submitting ? "Processing..." : `Place Order • ${formatPrice(summary.total, currency)}`}
            onPress={() => void handleCheckout()}
          />
        </View>
      ) : null}

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#1F4B3F",
    borderRadius: radii.xl,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroEyebrow: {
    color: "rgba(231,255,245,0.76)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 31,
    marginTop: spacing.xs,
  },
  heroMetrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  metricLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  statusCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  statusText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  list: {
    gap: spacing.md,
  },
  itemCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 22,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  itemCopy: {
    gap: spacing.xs,
  },
  itemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  itemMeta: {
    color: "#24513B",
    fontSize: 14,
    fontWeight: "700",
  },
  itemFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  qtyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  qtyButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  qtyButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
  },
  quantity: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    minWidth: 22,
    textAlign: "center",
  },
  removeButton: {
    backgroundColor: "rgba(255,245,248,0.96)",
    borderColor: "rgba(179,61,104,0.18)",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  removeButtonText: {
    color: "#B33D68",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: radii.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  summaryPanel: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryKey: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  summaryValueText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.xs,
  },
  summaryTotalKey: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  summaryTotalValue: {
    color: "#1F4B3F",
    fontSize: 20,
    fontWeight: "800",
  },
  checkoutCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  input: {
    backgroundColor: "rgba(247,248,251,0.98)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  inputMultiline: {
    minHeight: 92,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  methodCard: {
    backgroundColor: "rgba(247,248,251,0.98)",
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  methodCardActive: {
    backgroundColor: "#1F4B3F",
    borderColor: "#1F4B3F",
  },
  methodTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  methodTitleActive: {
    color: colors.white,
  },
  methodBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  methodBodyActive: {
    color: "rgba(255,255,255,0.78)",
  },
});
