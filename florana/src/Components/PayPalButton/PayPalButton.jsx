// Render the legacy web component for Pay Pal Button.
import React from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function PayPalButton({ cart, onSuccess }) {
  const totalAmount = cart.reduce((acc, item) => acc + Number(item.price), 0);

  // Render the legacy web Pay Pal Button interface and its interactive controls.
  return (
    <PayPalScriptProvider options={{ "client-id": "YOUR_CLIENT_ID" }}>
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              { amount: { value: totalAmount.toFixed(2) } },
            ],
          });
        }}
        onApprove={async (data, actions) => {
          const order = await actions.order.capture();
          console.log("Payment successful:", order);
          onSuccess(order);
        }}
        onError={(err) => {
          console.error("PayPal Checkout Error:", err);
          alert("Payment failed âŒ");
        }}
      />
    </PayPalScriptProvider>
  );
}
