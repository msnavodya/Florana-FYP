// Render the legacy web component for Cart Page.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import { ArrowLeft, Menu, ShoppingBag, WalletCards, X } from "lucide-react";
import LanguageSelector from "../language/LanguageSelector";
import MenuPanel from "../menu/menu";
import "react-phone-input-2/lib/style.css";
import "./cartPage.css";

const exchangeRates = { LKR: 1, USD: 0.0033, EUR: 0.003 };
const currencySymbols = { LKR: "Rs.", USD: "$", EUR: "EUR" };

export default function CartPage() {
  // Use client-side navigation to move between legacy web pages from this component.
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [step, setStep] = useState(0);
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [currency, setCurrency] = useState(localStorage.getItem("currency") || "LKR");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const formatPrice = (price) => {
    const converted = Number(price || 0) * exchangeRates[currency];
    return `${currencySymbols[currency]} ${converted.toFixed(2)}`;
  };

  const showStatus = (message) => {
    setStatus(message);
    window.clearTimeout(window.floranaCartStatusTimer);
    window.floranaCartStatusTimer = window.setTimeout(() => setStatus(""), 2600);
  };

  const handleBack = () => {
    if (showPayment) {
      if (step > 0) {
        setStep((previous) => previous - 1);
      } else {
        setShowPayment(false);
      }
      return;
    }

    navigate(-1);
  };

  const removeFromCart = (id) => {
    const updatedCart = cartItems.filter((item, index) => `${item.id}-${index}` !== id);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    showStatus("Item removed from cart.");
  };

  const isValidPhone = (value) => {
    const slRegex = /^7\d{8}$|^0\d{9}$/;
    const usRegex = /^\d{10}$/;
    if (value.startsWith("94")) return slRegex.test(value.slice(2));
    if (value.startsWith("1")) return usRegex.test(value);
    return value.length >= 8;
  };

  const sendOtp = () => {
    if (!isValidPhone(phone)) {
      showStatus("Enter a valid phone number first.");
      return;
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000);
    setGeneratedOtp(String(otpCode));
    setStep(2);
    showStatus(`Demo OTP sent: ${otpCode}`);
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      setStep(3);
      showStatus("Phone verified.");
      return;
    }

    showStatus("Invalid OTP. Try again.");
  };

  const validateCard = () => {
    const { number, name, expiry, cvv } = card;

    if (!number.match(/^\d{16}$/)) {
      showStatus("Card number must be 16 digits.");
      return false;
    }

    if (!name.trim()) {
      showStatus("Enter the cardholder name.");
      return false;
    }

    if (!expiry.match(/^\d{2}\/\d{2}$/)) {
      showStatus("Expiry must use MM/YY.");
      return false;
    }

    if (!cvv.match(/^\d{3,4}$/)) {
      showStatus("CVV must be 3 or 4 digits.");
      return false;
    }

    return true;
  };

  const handlePayment = () => {
    if (paymentMethod === "card" && !validateCard()) {
      return;
    }

    setStep(4);
    showStatus("Payment completed successfully.");

    window.setTimeout(() => {
      localStorage.removeItem("cart");
      setCartItems([]);
      setShowPayment(false);
      setStep(0);
      setPhone("");
      setOtp("");
      setGeneratedOtp("");
      setCard({ number: "", name: "", expiry: "", cvv: "" });
    }, 1800);
  };

  const beginCheckout = () => {
    if (cartItems.length === 0) {
      showStatus("Your cart is empty.");
      return;
    }

    setShowPayment(true);
    setStep(0);
  };

  // Render the legacy web cart Page interface and its interactive controls.
  return (
    <div className="app mobile-screen">
      <div className="cart-page mobile-frame">
        <div className="cart-scroll mobile-panel">
          <div className="nav">
            <button className="back-btn" aria-label="Go back" onClick={handleBack}>
              <ArrowLeft size={18} />
            </button>

            <div className="cart-title-wrap">
              <p className="cart-eyebrow">Florana Checkout</p>
              <h3 className="cart-heading">My Cart</h3>
            </div>

            <div className="cart-toolbar">
              <LanguageSelector />

              <button className="cart-icon-btn compact-cart-btn" aria-label="Cart overview">
                <ShoppingBag size={16} />
                {cartItems.length > 0 ? <span className="catalog-cart-badge">{cartItems.length}</span> : null}
              </button>

              <label className="cart-currency-pill compact-cart-btn" aria-label="Currency converter">
                <WalletCards size={14} />
                <select
                  className="currency-mini compact-currency-mini"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                >
                  <option value="LKR">LKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>

              <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
                <Menu size={18} />
              </button>
            </div>
          </div>

          <div className="cart-summary-card">
            <div>
              <p>Items in cart</p>
              <strong>{cartItems.length}</strong>
            </div>
            <div>
              <p>Total</p>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>

          {status ? <div className="cart-status">{status}</div> : null}

          <div className="cart-box">
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => {
                const itemKey = `${item.id}-${index}`;

                return (
                  <div key={itemKey} className="item">
                    <div>
                      <h4>{item.name}</h4>
                      <p>{formatPrice(item.price)}</p>
                    </div>

                    <button className="delete-btn" aria-label="Remove item" onClick={() => removeFromCart(itemKey)}>
                      <X size={16} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <ShoppingBag size={34} />
                <p>Your cart is empty right now.</p>
                <button className="checkout-btn" onClick={() => navigate("/catalog")}>
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {cartItems.length > 0 ? (
            <button className="checkout-btn" onClick={beginCheckout}>
              Proceed to Payment
            </button>
          ) : null}

          {showPayment ? (
            <div className="overlay">
              <div className="overlay-bg" onClick={() => setShowPayment(false)} />
              <div className="payment-drawer">
                {step === 0 ? (
                  <>
                    <h2>Select Payment Method</h2>
                    <div className="method-item" onClick={() => { setPaymentMethod("card"); setStep(1); }}>
                      <h4>Credit Card</h4>
                    </div>
                    <div className="method-item" onClick={() => { setPaymentMethod("paypal"); setStep(1); }}>
                      <h4>PayPal</h4>
                    </div>
                    <div className="method-item" onClick={() => { setPaymentMethod("cod"); setStep(1); }}>
                      <h4>Cash on Delivery</h4>
                    </div>
                  </>
                ) : null}

                {step === 1 ? (
                  <>
                    <h2>Enter Your Phone</h2>
                    <PhoneInput
                      country="lk"
                      value={phone}
                      onChange={setPhone}
                      enableSearch
                      placeholder="Phone number"
                      inputStyle={{ width: "100%", height: "46px", borderRadius: "14px" }}
                      buttonStyle={{ borderRadius: "14px 0 0 14px" }}
                    />
                    <button className="pay-btn" onClick={sendOtp}>
                      Send OTP
                    </button>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <h2>Verify OTP</h2>
                    <input
                      className="input"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                    />
                    <button className="pay-btn" onClick={verifyOtp}>
                      Verify
                    </button>
                  </>
                ) : null}

                {step === 3 ? (
                  <>
                    {paymentMethod === "card" ? (
                      <>
                        <h2>Card Details</h2>
                        <input
                          className="input"
                          placeholder="Card Number (16 digits)"
                          value={card.number}
                          onChange={(event) => setCard({ ...card, number: event.target.value.replace(/\D/g, "") })}
                        />
                        <input
                          className="input"
                          placeholder="Name on Card"
                          value={card.name}
                          onChange={(event) => setCard({ ...card, name: event.target.value })}
                        />
                        <input
                          className="input"
                          placeholder="MM/YY"
                          value={card.expiry}
                          onChange={(event) => setCard({ ...card, expiry: event.target.value })}
                        />
                        <input
                          className="input"
                          placeholder="CVV"
                          value={card.cvv}
                          onChange={(event) => setCard({ ...card, cvv: event.target.value.replace(/\D/g, "") })}
                        />
                        <button className="pay-btn" onClick={handlePayment}>
                          Pay {formatPrice(total)}
                        </button>
                      </>
                    ) : null}

                    {paymentMethod === "paypal" ? (
                      <button className="pay-btn" onClick={handlePayment}>
                        PayPal {formatPrice(total)}
                      </button>
                    ) : null}

                    {paymentMethod === "cod" ? (
                      <button className="pay-btn" onClick={handlePayment}>
                        Cash on Delivery {formatPrice(total)}
                      </button>
                    ) : null}
                  </>
                ) : null}

                {step === 4 ? (
                  <div className="success">
                    <h2>Payment Successful</h2>
                    <p>Thank you for your order.</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <MenuPanel isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
