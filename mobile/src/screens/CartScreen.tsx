import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useCart } from "../context/CartContext";
import { notifyPayment } from "../lib/api/payment";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import { formatPrice } from "../utils/shop";

type PaymentMethod = "card" | "paypal" | "cod";

export function CartScreen() {
  const { items, currency, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });

  const total = useMemo(() => subtotal, [subtotal]);

  const sendOtp = () => {
    if (phone.replace(/\D/g, "").length < 8) {
      setStatus("Enter a valid phone number first.");
      return;
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000);
    setGeneratedOtp(String(otpCode));
    setStep(2);
    setStatus(`Demo OTP sent: ${otpCode}`);
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      setStep(3);
      setStatus("Phone verified.");
      return;
    }

    setStatus("Invalid OTP. Try again.");
  };

  const validateCard = () => {
    if (!card.number.match(/^\d{16}$/)) return "Card number must be 16 digits.";
    if (!card.name.trim()) return "Enter the cardholder name.";
    if (!card.expiry.match(/^\d{2}\/\d{2}$/)) return "Expiry must use MM/YY.";
    if (!card.cvv.match(/^\d{3,4}$/)) return "CVV must be 3 or 4 digits.";
    return null;
  };

  const handlePayment = async () => {
    if (paymentMethod === "card") {
      const error = validateCard();
      if (error) {
        setStatus(error);
        return;
      }
    }

    try {
      await notifyPayment({
        currency,
        itemCount: items.length,
        method: paymentMethod,
        phone,
        total,
      });
    } catch {
      setStatus("Payment completed, but the backend notification could not be confirmed.");
      return;
    }

    setStep(4);
    setStatus("Payment completed successfully.");
    await clearCart();
  };

  return (
    <Screen>
      <TopBar title="My Cart" subtitle="Florana Checkout" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Items in cart</Text>
          <Text style={styles.summaryValue}>{items.length}</Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{formatPrice(total, currency)}</Text>
        </View>
      </View>

      {status ? <View style={styles.statusCard}><Text style={styles.statusText}>{status}</Text></View> : null}

      {items.length > 0 ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{formatPrice(item.price, currency)}</Text>
              </View>
              <View style={styles.itemActions}>
                <View style={styles.qtyRow}>
                  <Pressable onPress={() => void updateQuantity(item.id, item.quantity - 1)} style={styles.qtyButton}>
                    <Text style={styles.qtyButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <Pressable onPress={() => void updateQuantity(item.id, item.quantity + 1)} style={styles.qtyButton}>
                    <Text style={styles.qtyButtonText}>+</Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => void removeItem(item.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Your cart is empty right now.</Text>
          <Text style={styles.emptyText}>Browse the catalog and add a few plants to start checkout.</Text>
          <PrimaryButton label="Continue Shopping" onPress={() => router.push("/catalog")} variant="secondary" />
        </View>
      )}

      {items.length > 0 && !showPayment ? (
        <PrimaryButton
          label="Proceed to Payment"
          onPress={() => {
            setShowPayment(true);
            setStep(0);
          }}
        />
      ) : null}

      {showPayment ? (
        <View style={styles.paymentDrawer}>
          {step === 0 ? (
            <>
              <Text style={styles.paymentTitle}>Select Payment Method</Text>
              <Pressable onPress={() => { setPaymentMethod("card"); setStep(1); }} style={styles.methodCard}>
                <Text style={styles.methodTitle}>Credit Card</Text>
              </Pressable>
              <Pressable onPress={() => { setPaymentMethod("paypal"); setStep(1); }} style={styles.methodCard}>
                <Text style={styles.methodTitle}>PayPal</Text>
              </Pressable>
              <Pressable onPress={() => { setPaymentMethod("cod"); setStep(1); }} style={styles.methodCard}>
                <Text style={styles.methodTitle}>Cash on Delivery</Text>
              </Pressable>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={styles.paymentTitle}>Enter Your Phone</Text>
              <TextInput
                keyboardType="phone-pad"
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={phone}
              />
              <PrimaryButton label="Send OTP" onPress={sendOtp} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={styles.paymentTitle}>Verify OTP</Text>
              <TextInput
                keyboardType="number-pad"
                onChangeText={setOtp}
                placeholder="Enter OTP"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={otp}
              />
              <PrimaryButton label="Verify" onPress={verifyOtp} />
            </>
          ) : null}

          {step === 3 && paymentMethod === "card" ? (
            <>
              <Text style={styles.paymentTitle}>Card Details</Text>
              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) => setCard((current) => ({ ...current, number: value.replace(/\D/g, "") }))}
                placeholder="Card Number (16 digits)"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={card.number}
              />
              <TextInput
                onChangeText={(value) => setCard((current) => ({ ...current, name: value }))}
                placeholder="Name on Card"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={card.name}
              />
              <TextInput
                onChangeText={(value) => setCard((current) => ({ ...current, expiry: value }))}
                placeholder="MM/YY"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={card.expiry}
              />
              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) => setCard((current) => ({ ...current, cvv: value.replace(/\D/g, "") }))}
                placeholder="CVV"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={card.cvv}
              />
              <PrimaryButton label={`Pay ${formatPrice(total, currency)}`} onPress={() => void handlePayment()} />
            </>
          ) : null}

          {step === 3 && paymentMethod !== "card" ? (
            <>
              <Text style={styles.paymentTitle}>{paymentMethod === "paypal" ? "PayPal" : "Cash on Delivery"}</Text>
              <PrimaryButton label={`Confirm ${formatPrice(total, currency)}`} onPress={() => void handlePayment()} />
            </>
          ) : null}

          {step === 4 ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Payment Successful</Text>
              <Text style={styles.successText}>Thank you for your order.</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: "#6A52CB",
    borderRadius: radii.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: "600",
  },
  summaryValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  statusCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  statusText: {
    color: "#24513B",
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    gap: spacing.md,
  },
  itemCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  itemInfo: {
    gap: spacing.xs,
  },
  itemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  itemMeta: {
    color: "#22553F",
    fontSize: 14,
    fontWeight: "700",
  },
  itemActions: {
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
    height: 36,
    justifyContent: "center",
    width: 36,
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
    minWidth: 18,
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "rgba(255,245,248,0.98)",
    borderColor: "rgba(179,61,104,0.16)",
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  deleteButtonText: {
    color: "#B33D68",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: radii.xl,
    gap: spacing.sm,
    padding: spacing.lg,
    ...shadows.soft,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  paymentDrawer: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  paymentTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  methodCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  methodTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  successCard: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  successTitle: {
    color: colors.success,
    fontSize: 22,
    fontWeight: "800",
  },
  successText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
});
