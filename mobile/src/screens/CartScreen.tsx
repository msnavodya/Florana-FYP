// Render the mobile Cart screen.
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  Image,
} from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { CurrencySwitcher } from "../components/CurrencySwitcher";
import { LanguageSelector } from "../components/LanguageSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import {
  confirmPayment,
  createPaymentIntent,
  type PaymentIntentPayload,
  type PaymentIntentResponse,
} from "../lib/api/payment";
import { buildApiUrl } from "../lib/api/config";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

type CheckoutMethod = "stripe" | "cod";
type CheckoutStep = 0 | 1 | 2 | 3 | 4;
type LanguageCode = "en" | "si" | "ta";

const cartCopy: Record<
  LanguageCode,
  {
    checkout: string;
    myCart: string;
    itemsInCart: string;
    total: string;
    empty: string;
    continueShopping: string;
    preparing: string;
    proceed: string;
    paymentMethod: string;
    creditCard: string;
    creditCardDesc: string;
    paypalDesc: string;
    cod: string;
    codDesc: string;
    verifyMobile: string;
    phoneCopy: string;
    phoneNumber: string;
    sending: string;
    sendOtp: string;
    enterOtp: string;
    cardDetails: string;
    cardCopy: string;
    cardNumber: string;
    nameOnCard: string;
    expiry: string;
    submitting: string;
    pay: string;
    paypalCheckout: string;
    paypalCopy: string;
    codCopy: string;
    confirmCod: string;
    processing: string;
    processingCopy: string;
    confirmed: string;
    completed: string;
  }
> = {
  en: {
    checkout: "Florana Checkout",
    myCart: "My Cart",
    itemsInCart: "Items in cart",
    total: "Total",
    empty: "Your cart is empty right now.",
    continueShopping: "Continue Shopping",
    preparing: "Preparing checkout...",
    proceed: "Proceed to Payment",
    paymentMethod: "Select Payment Method",
    creditCard: "Stripe",
    creditCardDesc: "Secure card checkout powered by Stripe.",
    paypalDesc: "Backend marks it processing and confirms in real time.",
    cod: "Cash on Delivery",
    codDesc: "Confirm now and pay when the order arrives.",
    verifyMobile: "Verify Mobile Number",
    phoneCopy: "We use phone verification before payment confirmation.",
    phoneNumber: "Phone number",
    sending: "Sending...",
    sendOtp: "Continue",
    enterOtp: "Enter OTP",
    cardDetails: "Card Details",
    cardCopy: "Card data is validated by the backend before processing.",
    cardNumber: "Card Number (16 digits)",
    nameOnCard: "Name on Card",
    expiry: "MM/YY",
    submitting: "Submitting...",
    pay: "Pay",
    paypalCheckout: "PayPal Checkout",
    paypalCopy: "PayPal Sandbox is available on the web version, but the current mobile backend is not wired for PayPal confirmation yet.",
    codCopy: "Confirm the order now and pay the courier on delivery.",
    confirmCod: "Confirm COD",
    processing: "Payment Processing",
    processingCopy: "We are checking the latest order status from the backend.",
    confirmed: "Order Confirmed",
    completed: "Your payment flow completed successfully.",
  },
  si: {
    checkout: "à·†à·Šà¶½à·à¶»à·à¶±à· à¶œà·™à·€à·“à¶¸à·Š",
    myCart: "à¶¸à¶œà·š à¶šà¶»à¶­à·Šà¶­à¶º",
    itemsInCart: "à¶šà¶»à¶­à·Šà¶­à¶ºà·š à¶…à¶ºà·’à¶­à¶¸",
    total: "à¶¸à·”à·…à·” à¶‘à¶šà¶­à·”à·€",
    empty: "à¶”à¶¶à¶œà·š à¶šà¶»à¶­à·Šà¶­à¶º à¶¯à·à¶±à·Š à·„à·’à·ƒà·Šà¶º.",
    continueShopping: "à·ƒà·à¶´à·Šà¶´à·” à¶ºà·à¶¸ à¶¯à·’à¶œà¶§à¶¸ à¶šà¶»à¶œà·™à¶± à¶ºà¶±à·Šà¶±",
    preparing: "à¶œà·™à·€à·“à¶¸ à·ƒà·–à¶¯à·à¶±à¶¸à·Š à¶šà¶»à¶¸à·’à¶±à·Š...",
    proceed: "à¶œà·™à·€à·“à¶¸à¶§ à¶‰à¶¯à·’à¶»à·’à¶ºà¶§ à¶ºà¶±à·Šà¶±",
    paymentMethod: "à¶œà·™à·€à·“à¶¸à·š à¶šà·Šâ€à¶»à¶¸à¶º à¶­à·à¶»à¶±à·Šà¶±",
    creditCard: "à¶šà·Šâ€à¶»à·™à¶©à·’à¶§à·Š à¶šà·à¶©à·Š",
    creditCardDesc: "à¶†à¶»à¶šà·Šà·‚à·’à¶­ à¶šà·à¶©à·Š à¶­à·„à·€à·”à¶»à·” à¶šà·’à¶»à·“à¶¸ à·ƒà¶¸à¶Ÿ à·€à·šà¶œà·€à¶­à·Š à¶œà·™à·€à·“à¶¸.",
    paypalDesc: "à¶¶à·à¶šà·Šà¶‘à¶±à·Šà¶©à·Š à¶‘à¶º à¶šà·Šâ€à¶»à·’à¶ºà·à·€à¶½à·’à¶ºà·š à¶¶à·€ à¶½à·™à·ƒ à·ƒà¶½à¶šà·”à¶«à·” à¶šà¶» à¶­à¶­à·Šâ€à¶º à¶šà·à¶½à·“à¶±à·€ à¶­à·„à·€à·”à¶»à·” à¶šà¶»à¶ºà·’.",
    cod: "à¶·à·à¶»à¶¯à·“à¶¸à·šà¶¯à·“ à¶¸à·”à¶¯à¶½à·Š",
    codDesc: "à¶¯à·à¶±à·Š à¶­à·„à·€à·”à¶»à·” à¶šà¶» à¶‡à¶«à·€à·”à¶¸ à¶´à·à¶¸à·’à¶«à·’ à·€à·’à¶§ à¶œà·™à·€à¶±à·Šà¶±.",
    verifyMobile: "à¶¢à¶‚à¶œà¶¸ à¶¯à·”à¶»à¶šà¶®à¶± à¶…à¶‚à¶šà¶º à¶­à·„à·€à·”à¶»à·” à¶šà¶»à¶±à·Šà¶±",
    phoneCopy: "à¶œà·™à·€à·“à¶¸ à¶­à·„à·€à·”à¶»à·” à¶šà·’à¶»à·“à¶¸à¶§ à¶´à·™à¶» à¶…à¶´à·’ à¶¯à·”à¶»à¶šà¶®à¶± à¶­à·„à·€à·”à¶»à·” à¶šà·’à¶»à·“à¶¸ à¶·à·à·€à·’à¶­à· à¶šà¶»à¶¸à·”.",
    phoneNumber: "à¶¯à·”à¶»à¶šà¶®à¶± à¶…à¶‚à¶šà¶º",
    sending: "à¶ºà·€à¶¸à·’à¶±à·Š...",
    sendOtp: "à¶‰à¶¯à·’à¶»à·’à¶ºà¶§ à¶ºà¶±à·Šà¶±",
    enterOtp: "OTP à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±",
    cardDetails: "à¶šà·à¶©à·Š à·€à·’à·ƒà·Šà¶­à¶»",
    cardCopy: "à¶šà·à¶©à·Š à¶¯à¶­à·Šà¶­ à¶šà·Šâ€à¶»à·’à¶ºà·à·€à¶½à·’à¶ºà¶§ à¶´à·™à¶» à¶¶à·à¶šà·Šà¶‘à¶±à·Šà¶©à·Š à¶¸à¶œà·’à¶±à·Š à¶­à·„à·€à·”à¶»à·” à¶šà¶»à¶ºà·’.",
    cardNumber: "à¶šà·à¶©à·Š à¶…à¶‚à¶šà¶º (à¶…à¶‚à¶š 16)",
    nameOnCard: "à¶šà·à¶©à·Šà¶´à¶­à·š à¶±à¶¸",
    expiry: "MM/YY",
    submitting: "à¶‰à¶¯à·’à¶»à·’à¶´à¶­à·Š à¶šà¶»à¶¸à·’à¶±à·Š...",
    pay: "à¶œà·™à·€à¶±à·Šà¶±",
    paypalCheckout: "PayPal à¶œà·™à·€à·“à¶¸",
    paypalCopy: "à·€à·™à¶¶à·Š à·ƒà¶‚à·ƒà·Šà¶šà¶»à¶«à¶ºà·š PayPal Sandbox à¶´à·€à¶­à·’à¶± à¶±à¶¸à·”à¶­à·Š à·€à¶­à·Šà¶¸à¶±à·Š à¶¢à¶‚à¶œà¶¸ à¶¶à·à¶šà·Šà¶‘à¶±à·Šà¶©à·Š PayPal à¶­à·„à·€à·”à¶»à·”à·€ à·ƒà¶³à·„à· à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶° à¶šà¶» à¶±à·œà¶¸à·à¶­.",
    codCopy: "à¶¯à·à¶±à·Š à¶‡à¶«à·€à·”à¶¸ à¶­à·„à·€à·”à¶»à·” à¶šà¶» à¶·à·à¶»à¶¯à·“à¶¸à·šà¶¯à·“ à¶šà·”à¶»à·’à¶ºà¶»à·Šà¶§ à¶œà·™à·€à¶±à·Šà¶±.",
    confirmCod: "COD à¶­à·„à·€à·”à¶»à·” à¶šà¶»à¶±à·Šà¶±",
    processing: "à¶œà·™à·€à·“à¶¸ à·ƒà·à¶šà·ƒà·™à¶¸à·’à¶±à·Š à¶´à·€à¶­à·“",
    processingCopy: "à¶…à¶´à·’ à¶¶à·à¶šà·Šà¶‘à¶±à·Šà¶©à·Š à·€à·™à¶­à·’à¶±à·Š à¶±à·€à¶­à¶¸ à¶‡à¶«à·€à·”à¶¸à·Š à¶­à¶­à·Šà¶­à·Šà·€à¶º à¶´à¶»à·“à¶šà·Šà·‚à· à¶šà¶»à¶¸à·’à¶±à·Š à·ƒà·’à¶§à·’à¶¸à·”.",
    confirmed: "à¶‡à¶«à·€à·”à¶¸ à¶­à·„à·€à·”à¶»à·”à¶ºà·’",
    completed: "à¶”à¶¶à¶œà·š à¶œà·™à·€à·“à¶¸à·š à¶šà·Šâ€à¶»à·’à¶ºà·à·€à¶½à·’à¶º à·ƒà·à¶»à·Šà¶®à¶šà·€ à¶…à·€à·ƒà¶±à·Š à·€à·’à¶º.",
  },
  ta: {
    checkout: "à®ƒà®ªà¯à®³à¯‹à®°à®¾à®©à®¾ à®•à®Ÿà¯à®Ÿà®£à®®à¯",
    myCart: "à®Žà®©à¯ à®µà®£à¯à®Ÿà®¿",
    itemsInCart: "à®µà®£à¯à®Ÿà®¿à®¯à®¿à®²à¯ à®‰à®³à¯à®³à®µà¯ˆ",
    total: "à®®à¯Šà®¤à¯à®¤à®®à¯",
    empty: "à®‰à®™à¯à®•à®³à¯ à®µà®£à¯à®Ÿà®¿ à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®•à®¾à®²à®¿à®¯à®¾à®• à®‰à®³à¯à®³à®¤à¯.",
    continueShopping: "à®·à®¾à®ªà¯à®ªà®¿à®™à¯à®•à¯ˆ à®¤à¯Šà®Ÿà®°à¯à®™à¯à®•à®³à¯",
    preparing: "à®•à®Ÿà¯à®Ÿà®£à®®à¯ à®¤à®¯à®¾à®°à¯ à®šà¯†à®¯à¯à®¯à®ªà¯à®ªà®Ÿà¯à®•à®¿à®±à®¤à¯...",
    proceed: "à®•à®Ÿà¯à®Ÿà®£à®¤à¯à®¤à®¿à®±à¯à®•à¯ à®šà¯†à®²à¯à®²à¯à®™à¯à®•à®³à¯",
    paymentMethod: "à®•à®Ÿà¯à®Ÿà®£ à®®à¯à®±à¯ˆà®¯à¯ˆ à®¤à¯‡à®°à¯à®µà¯à®šà¯†à®¯à¯à®•",
    creditCard: "à®•à®¿à®°à¯†à®Ÿà®¿à®Ÿà¯ à®•à®¾à®°à¯à®Ÿà¯",
    creditCardDesc: "à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®© à®…à®Ÿà¯à®Ÿà¯ˆ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯à®Ÿà®©à¯ à®µà®¿à®°à¯ˆà®µà®¾à®© à®•à®Ÿà¯à®Ÿà®£à®®à¯.",
    paypalDesc: "à®ªà®¿à®©à¯à®ªà¯à®± à®…à®®à¯ˆà®ªà¯à®ªà¯ à®‡à®¤à¯ˆ à®šà¯†à®¯à®²à®¾à®•à¯à®•à®®à®¾à®• à®•à¯à®±à®¿à®¤à¯à®¤à¯ à®¨à¯‡à®°à®Ÿà®¿à®¯à®¾à®• à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à¯à®•à®¿à®±à®¤à¯.",
    cod: "à®µà®´à®™à¯à®•à¯à®®à¯ à®ªà¯‹à®¤à¯ à®ªà®£à®®à¯",
    codDesc: "à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à¯, à®†à®°à¯à®Ÿà®°à¯ à®µà®¨à¯à®¤à®ªà¯‹à®¤à¯ à®•à®Ÿà¯à®Ÿà®£à®®à¯ à®šà¯†à®²à¯à®¤à¯à®¤à¯à®™à¯à®•à®³à¯.",
    verifyMobile: "à®®à¯Šà®ªà¯ˆà®²à¯ à®Žà®£à¯à®£à¯ˆ à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à¯",
    phoneCopy: "à®•à®Ÿà¯à®Ÿà®£ à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®¾à®Ÿà¯à®Ÿà®¿à®±à¯à®•à¯ à®®à¯à®©à¯ à®¤à¯Šà®²à¯ˆà®ªà¯‡à®šà®¿ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯ˆà®ªà¯ à®ªà®¯à®©à¯à®ªà®Ÿà¯à®¤à¯à®¤à¯à®•à®¿à®±à¯‹à®®à¯.",
    phoneNumber: "à®¤à¯Šà®²à¯ˆà®ªà¯‡à®šà®¿ à®Žà®£à¯",
    sending: "à®…à®©à¯à®ªà¯à®ªà¯à®•à®¿à®±à®¤à¯...",
    sendOtp: "à®¤à¯Šà®Ÿà®°à®µà¯à®®à¯",
    enterOtp: "OTP à®‰à®³à¯à®³à®¿à®Ÿà¯à®•",
    cardDetails: "à®…à®Ÿà¯à®Ÿà¯ˆ à®µà®¿à®µà®°à®™à¯à®•à®³à¯",
    cardCopy: "à®šà¯†à®¯à®²à®¾à®•à¯à®•à®¤à¯à®¤à®¿à®±à¯à®•à¯ à®®à¯à®©à¯ à®…à®Ÿà¯à®Ÿà¯ˆ à®¤à®•à®µà®²à¯ à®ªà®¿à®©à¯à®ªà¯à®±à®¤à¯à®¤à®¿à®²à¯ à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®•à®¿à®±à®¤à¯.",
    cardNumber: "à®…à®Ÿà¯à®Ÿà¯ˆ à®Žà®£à¯ (16 à®‡à®²à®•à¯à®•à®™à¯à®•à®³à¯)",
    nameOnCard: "à®…à®Ÿà¯à®Ÿà¯ˆà®¯à®¿à®²à¯ à®‰à®³à¯à®³ à®ªà¯†à®¯à®°à¯",
    expiry: "MM/YY",
    submitting: "à®šà®®à®°à¯à®ªà¯à®ªà®¿à®•à¯à®•à®¿à®±à®¤à¯...",
    pay: "à®šà¯†à®²à¯à®¤à¯à®¤à¯",
    paypalCheckout: "PayPal à®•à®Ÿà¯à®Ÿà®£à®®à¯",
    paypalCopy: "à®µà®²à¯ˆ à®ªà®¤à®¿à®ªà¯à®ªà®¿à®²à¯ PayPal Sandbox à®‰à®³à¯à®³à®¤à¯, à®†à®©à®¾à®²à¯ à®¤à®±à¯à®ªà¯‹à®¤à¯ˆà®¯ à®®à¯Šà®ªà¯ˆà®²à¯ backend à®‡à®©à¯à®©à¯à®®à¯ PayPal à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®¾à®Ÿà¯à®Ÿà®¿à®±à¯à®•à¯ à®‡à®£à¯ˆà®•à¯à®•à®ªà¯à®ªà®Ÿà®µà®¿à®²à¯à®²à¯ˆ.",
    codCopy: "à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®†à®°à¯à®Ÿà®°à¯ˆ à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à¯, à®µà®´à®™à¯à®•à¯à®®à¯ à®ªà¯‹à®¤à¯ à®•à¯‚à®°à®¿à®¯à®°à¯à®•à¯à®•à¯ à®•à®Ÿà¯à®Ÿà®£à®®à¯ à®šà¯†à®²à¯à®¤à¯à®¤à¯à®™à¯à®•à®³à¯.",
    confirmCod: "COD à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à¯",
    processing: "à®•à®Ÿà¯à®Ÿà®£à®®à¯ à®šà¯†à®¯à®²à®¾à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®•à®¿à®±à®¤à¯",
    processingCopy: "à®ªà®¿à®©à¯à®ªà¯à®±à®¤à¯à®¤à®¿à®²à®¿à®°à¯à®¨à¯à®¤à¯ à®šà®®à¯€à®ªà®¤à¯à®¤à®¿à®¯ à®†à®°à¯à®Ÿà®°à¯ à®¨à®¿à®²à¯ˆà®¯à¯ˆ à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®•à®¿à®±à¯‹à®®à¯.",
    confirmed: "à®†à®°à¯à®Ÿà®°à¯ à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯",
    completed: "à®‰à®™à¯à®•à®³à¯ à®•à®Ÿà¯à®Ÿà®£ à®šà¯†à®¯à®²à¯à®®à¯à®±à¯ˆ à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®®à¯à®Ÿà®¿à®¨à¯à®¤à®¤à¯.",
  },
};

export function CartScreen() {
  const { height, width } = useWindowDimensions();
  // Keep the layout a bit tighter on smaller devices.
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const {
    items,
    currency,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    totalItems,
    convertedSubtotal,
    convertAmount,
    formatMoney,
  } = useCart();
  const { languageCode, t } = useLanguage();
  const localizedLanguageCode: LanguageCode = languageCode === "si" || languageCode === "ta" ? languageCode : "en";
  const copy = cartCopy[localizedLanguageCode];
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutMethod>("stripe");
  const [step, setStep] = useState<CheckoutStep>(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [intentResponse, setIntentResponse] = useState<PaymentIntentResponse | null>(null);
  const [delivery, setDelivery] = useState({
    phone: "",
    name: "",
    email: "",
    address: "",
    note: "",
  });
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const showStatus = (message: string) => {
    setStatus(message);
    if (statusTimer.current) {
      clearTimeout(statusTimer.current);
    }
    statusTimer.current = setTimeout(() => setStatus(""), 3200);
  };

  const resetCheckoutState = () => {
    setShowPayment(false);
    setPaymentMethod("stripe");
    setStep(0);
    setBusy(false);
    setIntentResponse(null);
    setDelivery({
      phone: "",
      name: "",
      email: "",
      address: "",
      note: "",
    });
    setCard({
      number: "",
      name: "",
      expiry: "",
      cvv: "",
    });
  };

  const total = useMemo(() => convertedSubtotal, [convertedSubtotal]);
  const isStripePayment = paymentMethod === "stripe";
  const stepLabels = [
    copy.paymentMethod,
    copy.verifyMobile,
    isStripePayment ? t("cart_stripe_card_details") : copy.cod,
    copy.processing,
  ];

  const buildPayload = (): PaymentIntentPayload => ({
    amount: total,
    currency,
    method: paymentMethod === "cod" ? "cod" : "card",
    item_count: totalItems,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: convertAmount(item.price),
    })),
    delivery: {
      name: delivery.name.trim(),
      phone: delivery.phone.trim(),
      email: delivery.email.trim() || undefined,
      address: delivery.address.trim(),
      note: delivery.note.trim() || undefined,
    },
  });

  const beginCheckout = () => {
    if (items.length === 0) {
      showStatus(copy.empty);
      return;
    }

    setShowPayment(true);
    setStep(0);
    showStatus(t("cart_start_checkout"));
  };

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    await removeItem(itemId);
    showStatus(t("cart_item_deleted", { name: itemName }));
  };

  const decreaseItem = async (itemId: string, itemName: string, quantity: number) => {
    if (quantity <= 1) {
      void handleRemoveItem(itemId, itemName);
      return;
    }

    await updateQuantity(itemId, quantity - 1);
    showStatus(t("cart_item_removed_one", { name: itemName }));
  };

  const increaseItem = async (itemId: string, quantity: number) => {
    await updateQuantity(itemId, quantity + 1);
  };

  const selectPaymentMethod = (method: CheckoutMethod) => {
    setPaymentMethod(method);

    setStep(1);
    showStatus(t("cart_delivery_continue"));
  };

  const continueFromDelivery = async () => {
    if (delivery.phone.trim().length < 7 || delivery.name.trim().length < 2 || delivery.address.trim().length < 6) {
      showStatus(t("cart_delivery_required"));
      return;
    }

    setBusy(true);
    try {
      const response = await createPaymentIntent(buildPayload());
      setIntentResponse(response);
      setStep(2);
      showStatus(
        paymentMethod === "cod"
          ? t("cart_delivery_verified_cod")
          : t("cart_delivery_saved_stripe")
      );
    } catch (error) {
      showStatus(error instanceof Error ? error.message : t("cart_prepare_failed"));
    } finally {
      setBusy(false);
    }
  };

  const handlePayment = async () => {
    if (!intentResponse) {
      showStatus(t("cart_restart_checkout"));
      return;
    }

    if (isStripePayment) {
      if (card.number.trim().length < 16 || card.name.trim().length < 2 || card.expiry.trim().length < 4 || card.cvv.trim().length < 3) {
        showStatus(t("cart_card_required"));
        return;
      }
    }

    setBusy(true);
    setStep(3);
    try {
      const response = await confirmPayment({
        ...buildPayload(),
        payment_intent_id: intentResponse.payment_intent_id,
        status:
          paymentMethod === "cod"
            ? "cod_confirmed"
            : "succeeded",
      });

      if (paymentMethod === "cod") {
        await clearCart();
        setStep(4);
        showStatus(t("cart_order_confirmed_cod"));
        return;
      }

      if (intentResponse.provider === "stripe" && intentResponse.payment_intent_id) {
        await clearCart();
        setStep(4);
        showStatus(t("cart_payment_done"));
      } else {
        await clearCart();
        setStep(4);
        showStatus(response.status === "ok" ? t("cart_payment_done") : t("cart_order_saved_cleared"));
      }
    } catch (error) {
      setStep(2);
      showStatus(error instanceof Error ? error.message : t("cart_checkout_failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    if (showPayment) {
      if (step > 0 && step < 3) {
        setStep((current) => (current - 1) as CheckoutStep);
        return;
      }

      resetCheckoutState();
      return;
    }

    router.back();
  };

  const renderInputField = ({
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType,
    autoCapitalize,
    multiline,
    style,
  }: {
    icon: keyof typeof MaterialIcons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (value: string) => void;
    keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    multiline?: boolean;
    style?: object;
  }) => (
    <View style={[styles.inputShell, multiline ? styles.inputShellMultiline : null, style]}>
      <View style={[styles.inputIconWrap, multiline ? styles.inputIconWrapTop : null]}>
        <MaterialIcons name={icon} size={18} color={colors.textMuted} />
      </View>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline ? styles.inputMultiline : null]}
        value={value}
      />
    </View>
  );

  // Render the mobile Cart screen and its main interactive sections.
  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.nav}>
        <View style={[styles.cartTopRow, compact ? styles.cartTopRowCompact : null]}>
          <Pressable accessibilityLabel={t("back")} onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          </Pressable>

          <View style={styles.cartToolbar}>
            <LanguageSelector />

            <Pressable accessibilityLabel={t("cart_overview")} style={styles.cartIconButton}>
              <MaterialIcons name="shopping-bag" size={16} color={colors.text} />
              {items.length > 0 ? (
                <View style={styles.catalogBadge}>
                  <Text style={styles.catalogBadgeText}>{items.length}</Text>
                </View>
              ) : null}
            </Pressable>

            <CurrencySwitcher />

            <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
              <MaterialIcons name="menu" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.cartTitleWrap}>
          <Text style={styles.cartEyebrow}>{copy.checkout}</Text>
          <Text style={styles.cartHeading}>{copy.myCart}</Text>
          <Text style={styles.cartSubtitle}>{t("cart_subtitle")}</Text>
        </View>
      </View>

      <View style={styles.cartSummaryCard}>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>{copy.itemsInCart}</Text>
          <Text style={styles.summaryValue}>{items.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={[styles.summaryBlock, styles.summaryTotal]}>
          <Text style={styles.summaryLabel}>{copy.total}</Text>
          <Text style={styles.summaryValue}>{formatMoney(subtotal)}</Text>
        </View>
      </View>

      {status ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <View style={styles.cartBox}>
        {items.length > 0 ? (
          items.map((item) => {
            const imageUri = item.image ? buildApiUrl(item.image) : null;

            return (
              <View key={item.id} style={styles.item}>
                <View style={styles.itemMain}>
                  {imageUri ? (
                    <Image resizeMode="cover" source={{ uri: imageUri }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemImageFallback}>
                      <MaterialIcons name="local-florist" size={24} color={colors.textMuted} />
                    </View>
                  )}

                  <View style={styles.itemCopy}>
                    <Text style={styles.itemTag}>{t("cart_item_tag")}</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity > 1 ? `${item.quantity} x ` : ""}
                      {formatMoney(item.price)}
                    </Text>
                    <Text style={styles.itemTotal}>{t("item_total", { total: formatMoney(Number(item.price || 0) * item.quantity) })}</Text>
                  </View>
                </View>

                <View style={styles.itemActions}>
                  <View style={styles.quantityStepper}>
                    <Pressable
                      accessibilityLabel={t("remove_one_item", { name: item.name })}
                      onPress={() => void decreaseItem(item.id, item.name, item.quantity)}
                      style={styles.quantityButton}
                    >
                      <MaterialIcons name="remove" size={16} color={colors.primaryDark} />
                    </Pressable>
                    <Text style={styles.quantityValue}>{item.quantity}</Text>
                    <Pressable
                      accessibilityLabel={t("add_one_item", { name: item.name })}
                      onPress={() => void increaseItem(item.id, item.quantity)}
                      style={styles.quantityButton}
                    >
                      <MaterialIcons name="add" size={16} color={colors.primaryDark} />
                    </Pressable>
                  </View>

                  <Pressable accessibilityLabel={t("remove_item")} onPress={() => void handleRemoveItem(item.id, item.name)} style={styles.deleteButton}>
                    <MaterialIcons name="delete-outline" size={17} color="#B33D68" />
                  </Pressable>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="shopping-bag" size={34} color={colors.textMuted} />
            <Text style={styles.emptyText}>{copy.empty}</Text>
            <PrimaryButton label={copy.continueShopping} onPress={() => router.push("/catalog")} variant="secondary" />
          </View>
        )}
      </View>

      {items.length > 0 ? (
        <PrimaryButton disabled={busy} label={busy ? copy.preparing : copy.proceed} onPress={beginCheckout} />
      ) : null}

      <Modal animationType="fade" transparent visible={showPayment} onRequestClose={resetCheckoutState}>
        <View style={styles.overlay}>
          <Pressable style={styles.overlayBg} onPress={resetCheckoutState} />

          <View style={styles.paymentDrawer}>
            <View style={styles.drawerHandle} />
            <View style={styles.paymentOrderChip}>
              <Text style={styles.paymentOrderLabel}>{t("cart_order_label")}</Text>
              <Text style={styles.paymentOrderValue}>
                {isStripePayment
                  ? intentResponse?.payment_intent_id || t("cart_stripe_secure_checkout")
                  : intentResponse?.provider || t("creating")}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {step < 4 ? (
                <View style={styles.stepRail}>
                  {stepLabels.map((label, index) => {
                    const active = step >= index;
                    return (
                      <View key={label} style={styles.stepItem}>
                        <View style={[styles.stepDot, active ? styles.stepDotActive : null]}>
                          <Text style={[styles.stepDotText, active ? styles.stepDotTextActive : null]}>{index + 1}</Text>
                        </View>
                        <Text numberOfLines={1} style={[styles.stepLabel, active ? styles.stepLabelActive : null]}>
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {step === 0 ? (
                <>
                  <Text style={styles.drawerTitle}>{copy.paymentMethod}</Text>
                  <Text style={styles.drawerCopy}>{t("cart_choose_payment_copy")}</Text>

                  <Pressable onPress={() => selectPaymentMethod("stripe")} style={[styles.methodItem, styles.methodItemStripe]}>
                    <View style={styles.methodHeader}>
                      <View style={styles.methodTitleRow}>
                        <View style={[styles.methodIcon, styles.methodIconStripe]}>
                          <MaterialIcons name="credit-card" size={18} color={colors.white} />
                        </View>
                        <Text style={styles.methodTitle}>{copy.creditCard}</Text>
                      </View>
                      <View style={styles.methodBadge}>
                        <Text style={styles.methodBadgeText}>{t("secure")}</Text>
                      </View>
                    </View>
                    <Text style={styles.methodBody}>{copy.creditCardDesc}</Text>
                  </Pressable>

                  <Pressable onPress={() => selectPaymentMethod("cod")} style={styles.methodItem}>
                    <View style={styles.methodTitleRow}>
                      <View style={[styles.methodIcon, styles.methodIconCod]}>
                        <MaterialIcons name="local-shipping" size={18} color={colors.white} />
                      </View>
                      <Text style={styles.methodTitle}>{copy.cod}</Text>
                    </View>
                    <Text style={styles.methodBody}>{copy.codDesc}</Text>
                  </Pressable>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <Text style={styles.drawerTitle}>{copy.verifyMobile}</Text>
                  <Text style={styles.drawerCopy}>{copy.phoneCopy}</Text>

                  <View style={styles.formSection}>
                    {renderInputField({
                      icon: "phone-iphone",
                      keyboardType: "phone-pad",
                      onChangeText: (value) => setDelivery((current) => ({ ...current, phone: value })),
                      placeholder: copy.phoneNumber,
                      value: delivery.phone,
                    })}
                    {renderInputField({
                      icon: "person-outline",
                      onChangeText: (value) => setDelivery((current) => ({ ...current, name: value })),
                      placeholder: t("full_name_placeholder"),
                      value: delivery.name,
                    })}
                    {renderInputField({
                      icon: "alternate-email",
                      autoCapitalize: "none",
                      keyboardType: "email-address",
                      onChangeText: (value) => setDelivery((current) => ({ ...current, email: value })),
                      placeholder: t("email_address_placeholder"),
                      value: delivery.email,
                    })}
                    {renderInputField({
                      icon: "location-on",
                      multiline: true,
                      onChangeText: (value) => setDelivery((current) => ({ ...current, address: value })),
                      placeholder: t("delivery_address_placeholder"),
                      value: delivery.address,
                    })}
                    {renderInputField({
                      icon: "sticky-note-2",
                      multiline: true,
                      onChangeText: (value) => setDelivery((current) => ({ ...current, note: value })),
                      placeholder: t("order_note_optional"),
                      value: delivery.note,
                    })}
                  </View>

                  <PrimaryButton
                    disabled={busy}
                    label={busy ? copy.sending : copy.sendOtp}
                    onPress={() => void continueFromDelivery()}
                  />
                </>
              ) : null}

              {step === 2 ? (
                <>
                  {isStripePayment ? (
                    <>
                      <Text style={styles.drawerTitle}>{t("cart_stripe_card_details")}</Text>
                      <Text style={styles.drawerCopy}>{t("cart_stripe_card_copy")}</Text>
                      <View style={styles.cardPreview}>
                        <View style={styles.cardPreviewHeader}>
                          <Text style={styles.cardPreviewLabel}>{t("cart_stripe_secure_checkout")}</Text>
                          <MaterialIcons name="verified-user" size={18} color={colors.white} />
                        </View>
                        <Text style={styles.cardPreviewNumber}>
                          {card.number ? card.number.replace(/(.{4})/g, "$1 ").trim() : "â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢"}
                        </Text>
                        <View style={styles.cardPreviewFooter}>
                          <Text style={styles.cardPreviewMeta}>{card.name || copy.nameOnCard}</Text>
                          <Text style={styles.cardPreviewMeta}>{card.expiry || copy.expiry}</Text>
                        </View>
                      </View>
                      <View style={styles.formSection}>
                        {renderInputField({
                          icon: "credit-card",
                          keyboardType: "number-pad",
                          onChangeText: (value) => setCard((current) => ({ ...current, number: value.replace(/\D/g, "") })),
                          placeholder: copy.cardNumber,
                          value: card.number,
                        })}
                        {renderInputField({
                          icon: "badge",
                          onChangeText: (value) => setCard((current) => ({ ...current, name: value })),
                          placeholder: copy.nameOnCard,
                          value: card.name,
                        })}
                      </View>
                      <View style={styles.cardGrid}>
                        {renderInputField({
                          icon: "calendar-month",
                          onChangeText: (value) => setCard((current) => ({ ...current, expiry: value })),
                          placeholder: copy.expiry,
                          style: styles.cardGridInput,
                          value: card.expiry,
                        })}
                        {renderInputField({
                          icon: "lock-outline",
                          keyboardType: "number-pad",
                          onChangeText: (value) => setCard((current) => ({ ...current, cvv: value.replace(/\D/g, "") })),
                          placeholder: t("cvv"),
                          style: styles.cardGridInput,
                          value: card.cvv,
                        })}
                      </View>

                      <PrimaryButton
                        disabled={busy}
                        label={busy ? copy.submitting : `${copy.pay} ${formatMoney(subtotal)}`}
                        onPress={() => void handlePayment()}
                      />
                    </>
                  ) : null}

                  {paymentMethod === "cod" ? (
                    <>
                      <Text style={styles.drawerTitle}>{copy.cod}</Text>
                      <Text style={styles.drawerCopy}>{copy.codCopy}</Text>
                      <View style={styles.codBox}>
                        <View style={styles.codIconWrap}>
                          <MaterialIcons name="local-shipping" size={22} color="#1F4B3F" />
                        </View>
                        <View style={styles.codCopyWrap}>
                          <Text style={styles.codTitle}>{t("cart_cod_delivery_title")}</Text>
                          <Text style={styles.codBody}>{t("cart_cod_delivery_copy")}</Text>
                        </View>
                      </View>
                      <PrimaryButton
                        disabled={busy}
                        label={busy ? copy.submitting : `${copy.confirmCod} ${formatMoney(subtotal)}`}
                        onPress={() => void handlePayment()}
                      />
                    </>
                  ) : null}
                </>
              ) : null}

              {step === 3 ? (
                <View style={styles.successBox}>
                  <MaterialIcons name="autorenew" size={26} color={colors.primaryDark} />
                  <Text style={styles.drawerTitle}>{copy.processing}</Text>
                  <Text style={styles.successText}>{copy.processingCopy}</Text>
                </View>
              ) : null}

              {step === 4 ? (
                <View style={styles.successBox}>
                  <MaterialIcons name="verified" size={28} color="#1F4B3F" />
                  <Text style={styles.drawerTitle}>{copy.confirmed}</Text>
                  <Text style={styles.successText}>
                    {isStripePayment && intentResponse?.provider === "stripe"
                      ? t("cart_stripe_success")
                      : copy.completed}
                  </Text>
                  <PrimaryButton
                    label={t("close")}
                    onPress={() => {
                      if (paymentMethod === "cod") {
                        resetCheckoutState();
                        return;
                      }
                      resetCheckoutState();
                    }}
                    variant="secondary"
                  />
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    marginBottom: spacing.md,
  },
  cartTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cartTopRowCompact: {
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
  cartToolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  cartIconButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    position: "relative",
    width: 42,
    ...shadows.soft,
  },
  catalogBadge: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.pill,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 5,
    position: "absolute",
    right: -4,
    top: -4,
  },
  catalogBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
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
  cartTitleWrap: {
    marginTop: spacing.lg,
  },
  cartEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  cartHeading: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  cartSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  cartSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  summaryDivider: {
    backgroundColor: colors.border,
    height: 42,
    width: 1,
  },
  summaryBlock: {
    gap: spacing.xs,
  },
  summaryTotal: {
    alignItems: "flex-end",
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  summaryValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
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
  cartBox: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 26,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  item: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  itemMain: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  itemImage: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    height: 96,
    width: 88,
  },
  itemImageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    height: 96,
    justifyContent: "center",
    width: 88,
  },
  itemCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  itemTag: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  itemName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "800",
  },
  itemTotal: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  itemActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  quantityStepper: {
    alignItems: "center",
    backgroundColor: "#F5F0FA",
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 36,
    overflow: "hidden",
  },
  quantityButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 34,
  },
  quantityValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    minWidth: 26,
    textAlign: "center",
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,245,248,0.96)",
    borderColor: "rgba(179,61,104,0.18)",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  emptyState: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  overlay: {
    backgroundColor: "rgba(16, 10, 29, 0.42)",
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
  },
  paymentDrawer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "82%",
    padding: spacing.lg,
    ...shadows.card,
  },
  drawerHandle: {
    alignSelf: "center",
    backgroundColor: "rgba(106,94,134,0.24)",
    borderRadius: radii.pill,
    height: 5,
    marginBottom: spacing.md,
    width: 56,
  },
  paymentOrderChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F5F0FA",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  paymentOrderLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  paymentOrderValue: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  stepRail: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  stepDot: {
    alignItems: "center",
    backgroundColor: "#EFE8F7",
    borderRadius: radii.pill,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  stepDotActive: {
    backgroundColor: colors.primaryDark,
  },
  stepDotText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  stepDotTextActive: {
    color: colors.white,
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  stepLabelActive: {
    color: colors.text,
  },
  drawerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },
  drawerCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  methodItem: {
    backgroundColor: "rgba(247,248,251,0.98)",
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  methodItemStripe: {
    borderColor: "rgba(124,92,255,0.26)",
    backgroundColor: "#F8F4FF",
  },
  methodItemMuted: {
    opacity: 0.9,
  },
  methodHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  methodTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  methodIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  methodIconStripe: {
    backgroundColor: colors.primaryDark,
  },
  methodIconCod: {
    backgroundColor: "#2C7A57",
  },
  methodBadge: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  methodBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
  },
  methodTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  methodBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  formSection: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  inputShell: {
    backgroundColor: "rgba(247,248,251,0.98)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  inputShellMultiline: {
    minHeight: 92,
  },
  inputIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
  },
  inputIconWrapTop: {
    alignItems: "flex-start",
    paddingTop: spacing.md,
  },
  input: {
    color: colors.text,
    flex: 1,
    minHeight: 50,
  },
  inputMultiline: {
    minHeight: 92,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  cardGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cardGridInput: {
    flex: 1,
  },
  cardPreview: {
    backgroundColor: "#1F4B3F",
    borderRadius: 24,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  cardPreviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  cardPreviewLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  cardPreviewNumber: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: spacing.lg,
  },
  cardPreviewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardPreviewMeta: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "700",
  },
  codBox: {
    alignItems: "flex-start",
    backgroundColor: "#EEF8F2",
    borderColor: "rgba(44,122,87,0.14)",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  codIconWrap: {
    alignItems: "center",
    backgroundColor: "#DDF2E4",
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  codCopyWrap: {
    flex: 1,
    gap: 4,
  },
  codTitle: {
    color: "#1F4B3F",
    fontSize: 15,
    fontWeight: "900",
  },
  codBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  successBox: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  successText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
});
