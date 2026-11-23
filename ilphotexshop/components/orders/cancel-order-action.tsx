"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerOrderCancelAction({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (status !== "pending") return null;

  async function cancelOrder() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}/cancel`,
        { method: "POST" },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "The order could not be cancelled.");
        return;
      }
      setConfirming(false);
      setMessage("Order cancelled.");
      router.refresh();
    } catch (error) {
      console.error("Could not cancel customer order", error);
      setMessage("The order could not be cancelled. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="customer-order-cancel">
      {confirming ? (
        <div className="customer-order-cancel-confirm" role="group" aria-label="Confirm order cancellation">
          <span>Cancel this pending order?</span>
          <button
            className="customer-order-danger"
            disabled={busy}
            onClick={cancelOrder}
            type="button"
          >
            {busy ? "Cancelling…" : "Confirm cancellation"}
          </button>
          <button
            className="customer-orders-back"
            disabled={busy}
            onClick={() => setConfirming(false)}
            type="button"
          >
            Keep order
          </button>
        </div>
      ) : (
        <button
          className="customer-orders-back"
          onClick={() => setConfirming(true)}
          type="button"
        >
          Cancel order
        </button>
      )}
      <p aria-live="polite">{message}</p>
    </div>
  );
}
