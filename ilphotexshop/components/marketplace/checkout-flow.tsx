"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Headphones,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ReceiptText,
  ShoppingBag,
  Truck,
  Upload,
} from "lucide-react";
import type { Product } from "@/data/products";

type CheckoutProduct = Product & {
  ownerId?: string | null;
  owner?: { phone: string | null } | null;
};

type CartEntry = { productId: string; quantity: number };

type CheckoutItem = {
  product: CheckoutProduct;
  quantity: number;
};

type PaymentAccount = {
  id: string;
  type: "bank" | "mobile_money";
  provider: string;
  accountName: string;
  accountNumber: string;
  currency: string;
};

export default function CheckoutFlow({
  accounts,
  customerName,
  isAuthenticated,
}: {
  accounts: PaymentAccount[];
  customerName: string;
  isAuthenticated: boolean;
}) {
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [fulfillmentComplete, setFulfillmentComplete] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<"receipt" | "system" | "cod">("receipt");
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "mobile_money">(
    accounts.some((account) => account.type === "mobile_money")
      ? "mobile_money"
      : "bank_transfer",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [receiptSubmitted, setReceiptSubmitted] = useState(false);
  const [merchantMessage, setMerchantMessage] = useState("");
  const [merchantSubject, setMerchantSubject] = useState("");
  const [merchantNotice, setMerchantNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCart() {
      try {
        const saved = localStorage.getItem("ilphotox-cart");
        const entries = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(entries)) throw new Error("Invalid cart");
        const validEntries = entries.filter(
          (entry): entry is CartEntry =>
            Boolean(entry) &&
            typeof entry === "object" &&
            typeof entry.productId === "string" &&
            typeof entry.quantity === "number" &&
            Number.isInteger(entry.quantity) &&
            entry.quantity > 0,
        );
        const response = await fetch("/api/products?limit=100&offset=0", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Catalog could not be loaded");
        const payload = (await response.json()) as { products: CheckoutProduct[] };
        const productsById = new Map(
          payload.products.map((product) => [product.id, product]),
        );
        if (!active) return;
        setItems(
          validEntries
            .map((entry) => {
              const product = productsById.get(entry.productId);
              if (!product) return null;
              return {
                product,
                quantity: Math.min(entry.quantity, product.stockQuantity ?? 100),
              };
            })
            .filter((item): item is CheckoutItem => Boolean(item)),
        );
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Your cart could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCart();
    return () => {
      active = false;
    };
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      ),
    [items],
  );

  function completeFulfillment() {
    setError("");
    const form = document.querySelector<HTMLFormElement>(".checkout-main");
    if (!form) return;
    const name = form.elements.namedItem("deliveryName") as HTMLInputElement | null;
    const phone = form.elements.namedItem("deliveryPhone") as HTMLInputElement | null;
    const deliveryAddress = form.elements.namedItem("deliveryAddress") as HTMLTextAreaElement | null;
    const pickupLocation = form.elements.namedItem("pickupLocation") as HTMLInputElement | null;

    if (!name || name.value.trim().length < 2) {
      setError("Enter the recipient name.");
      name?.focus();
      return;
    }
    const phoneDigits = phone?.value.replace(/\D/g, "") ?? "";
    if (!phone || phoneDigits.length < 7 || phoneDigits.length > 15) {
      setError("Enter a valid phone number.");
      phone?.focus();
      return;
    }
    if (fulfillment === "delivery") {
      if (!deliveryAddress || deliveryAddress.value.trim().length < 5) {
        setError("Enter the delivery address or use your current location.");
        deliveryAddress?.focus();
        return;
      }
    } else if (!pickupLocation || pickupLocation.value.trim().length < 3) {
      setError("Enter a pickup location.");
      pickupLocation?.focus();
      return;
    }
    setFulfillmentComplete(true);
  }

  function changeQuantity(productId: string, change: number) {
    setItems((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.min(
                  item.product.stockQuantity ?? 100,
                  item.quantity + change,
                ),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(productId: string) {
    setItems((current) =>
      current.filter((item) => item.product.id !== productId),
    );
  }

  function persistItems(nextItems: CheckoutItem[]) {
    localStorage.setItem(
      "ilphotox-cart",
      JSON.stringify(
        nextItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      ),
    );
  }

  useEffect(() => {
    if (!loading) persistItems(items);
  }, [items, loading]);

  async function useMyLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("Location services are not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const address = document.querySelector<HTMLInputElement>(
          "[name=deliveryAddress]",
        );
        if (address) {
          address.value =
            `Map location: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        }
        address?.setAttribute(
          "data-latitude",
          String(position.coords.latitude),
        );
        address?.setAttribute(
          "data-longitude",
          String(position.coords.longitude),
        );
      },
      () => setError("Your location could not be accessed."),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) {
      window.location.assign("/login?callbackUrl=%2Fcheckout");
      return;
    }
    if (!fulfillmentComplete) {
      setError("Complete delivery or pickup details before placing the order.");
      return;
    }
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const addressInput = form.elements.namedItem(
      "deliveryAddress",
    ) as HTMLInputElement | null;
    const latitude = addressInput?.dataset.latitude
      ? Number(addressInput.dataset.latitude)
      : undefined;
    const longitude = addressInput?.dataset.longitude
      ? Number(addressInput.dataset.longitude)
      : undefined;
    const idempotencyKey =
      typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          deliveryName: String(formData.get("deliveryName") ?? "").trim(),
          deliveryPhone: String(formData.get("deliveryPhone") ?? "").trim(),
          deliveryAddress:
            fulfillment === "delivery"
              ? String(formData.get("deliveryAddress") ?? "").trim()
              : "Pickup",
          fulfillmentMethod: fulfillment,
          pickupLocation:
            fulfillment === "pickup"
              ? String(formData.get("pickupLocation") ?? "").trim()
              : undefined,
          deliveryLatitude: latitude,
          deliveryLongitude: longitude,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { order?: { id: string }; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Order could not be placed.");
      }
      if (!payload?.order?.id) throw new Error("Order ID was not returned.");
      setOrderId(payload.order.id);
      localStorage.removeItem("ilphotox-cart");
      setItems([]);

      if (paymentChoice === "receipt") {
        const receipt = form.querySelector<HTMLInputElement>(
          'input[name="receipt"]',
        )?.files?.[0];
        const reference = String(
          formData.get("transactionReference") ?? "",
        ).trim();
        if (receipt) {
          const proofForm = new FormData();
          proofForm.set("method", paymentMethod);
          proofForm.set("transactionReference", reference);
          proofForm.set("document", receipt);
          const proofResponse = await fetch(
            `/api/orders/${encodeURIComponent(payload.order.id)}/payment-proofs`,
            { method: "POST", body: proofForm },
          );
          if (!proofResponse.ok) {
            const proofPayload = (await proofResponse.json().catch(
              () => null,
            )) as { error?: string } | null;
            throw new Error(
              proofPayload?.error ||
                "Order created, but payment receipt could not be submitted.",
            );
          }
          setReceiptSubmitted(true);
        }
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Checkout could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function messageMerchant(ownerId: string, merchantName: string) {
    setMerchantNotice("");
    if (!isAuthenticated) {
      window.location.assign("/login?callbackUrl=%2Fcheckout");
      return;
    }
    try {
      const response = await fetch("/api/checkout/merchant-conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: ownerId,
          subject: merchantSubject || `Question about ${merchantName}`,
          message: merchantMessage || `I have a question about products in my checkout.`,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Message could not be sent.");
      }
      setMerchantNotice(`Message sent to ${merchantName}.`);
      setMerchantMessage("");
      setMerchantSubject("");
    } catch (caught) {
      setMerchantNotice(
        caught instanceof Error
          ? caught.message
          : "Message could not be sent.",
      );
    }
  }

  if (loading) {
    return <div className="checkout-loading">Loading your checkout…</div>;
  }

  if (orderId) {
    return (
      <div className="checkout-success">
        <span><CheckCircle2 size={34} /></span>
        <h1>Order placed</h1>
        <p>
          Order #{orderId.slice(-8).toUpperCase()}
          {receiptSubmitted
            ? " · Payment receipt submitted for review"
            : ""}
        </p>
        <div className="checkout-contact-actions">
          <a href="tel:0788390989"><Phone size={17} /> Call support</a>
          <a href="https://wa.me/250736494012" rel="noopener noreferrer" target="_blank">
            <MessageCircle size={17} /> WhatsApp
          </a>
          <Link href={`/orders/${encodeURIComponent(orderId)}`}>
            View order
          </Link>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="checkout-empty">
        <span><Package size={30} /></span>
        <h1>Your cart is empty</h1>
        <p>Add products before starting checkout.</p>
        <Link href="/">Continue shopping</Link>
      </div>
    );
  }

  const merchantIds = [
    ...new Map(
      items
        .filter((item) => item.product.ownerId)
        .map((item) => [
          item.product.ownerId as string,
          item.product.seller,
        ]),
    ).entries(),
  ];

  return (
    <main className="checkout-page">
      <header className="checkout-topbar">
        <Link href="/" className="checkout-brand">
          <Image alt="" height={38} src="/ilphotox-shop-logo.png" width={38} />
          <span>ILPhotoX Shop</span>
        </Link>
        <nav aria-label="Checkout navigation">
          <Link href="/"><ShoppingBag size={16} /> Cart</Link>
          <Link href="/support/all-in-one"><Headphones size={16} /> Support</Link>
          <Link href="/checkout"><Banknote size={16} /> Payment</Link>
          {isAuthenticated && <Link href="/orders"><Package size={16} /> My Orders</Link>}
        </nav>
      </header>

      <div className="checkout-layout">
        <form className="checkout-main" onSubmit={submitOrder}>
          <div className="checkout-heading">
            <Link href="/"><ArrowLeft size={16} /> Continue shopping</Link>
            {isAuthenticated && <h1>Checkout</h1>}
            <p>
              {isAuthenticated
                ? `Signed in as ${customerName}`
                : "Review the items in your cart"}
            </p>
          </div>

          {!isAuthenticated && (
            <section className="checkout-card checkout-guest-summary">
              <h2><ShoppingBag size={19} /> Items in your cart</h2>
              <p>Sign in to enter delivery details and choose a payment method.</p>
            </section>
          )}

          {isAuthenticated && <section className="checkout-card">
            <h2><Truck size={19} /> Fulfillment</h2>
            <div className="checkout-choice-grid">
              <button
                className={fulfillment === "delivery" ? "is-selected" : ""}
                onClick={() => {
                  setFulfillment("delivery");
                  setFulfillmentComplete(false);
                }}
                type="button"
              >
                <Truck size={20} />
                <span><strong>Delivery</strong><small>Deliver to your address</small></span>
              </button>
              <button
                className={fulfillment === "pickup" ? "is-selected" : ""}
                onClick={() => {
                  setFulfillment("pickup");
                  setFulfillmentComplete(false);
                }}
                type="button"
              >
                <MapPin size={20} />
                <span><strong>Pickup</strong><small>Collect from the marketplace</small></span>
              </button>
            </div>

            {fulfillment === "delivery" ? (
              <div className="checkout-fields">
                <label>
                  Recipient name
                  <input name="deliveryName" minLength={2} required />
                </label>
                <label>
                  Phone number
                  <input name="deliveryPhone" minLength={7} maxLength={32} required />
                </label>
                <label className="checkout-full-field">
                  Delivery address
                  <textarea
                    data-longitude=""
                    data-latitude=""
                    name="deliveryAddress"
                    minLength={5}
                    required
                    rows={3}
                  />
                </label>
                <button
                  className="checkout-location-button checkout-full-field"
                  onClick={useMyLocation}
                  type="button"
                >
                  <MapPin size={16} /> Use my current location
                </button>
              </div>
            ) : (
              <div className="checkout-fields">
                <label>
                  Name
                  <input name="deliveryName" minLength={2} required />
                </label>
                <label>
                  Phone number
                  <input name="deliveryPhone" minLength={7} maxLength={32} required />
                </label>
                <label className="checkout-full-field">
                  Pickup location
                  <input
                    name="pickupLocation"
                    minLength={3}
                    placeholder="Choose a store or pickup point"
                    required
                  />
                </label>
              </div>
            )}
            {isAuthenticated && (
              <button
                className="checkout-location-button"
                disabled={fulfillmentComplete}
                onClick={completeFulfillment}
                type="button"
              >
                {fulfillmentComplete
                  ? "Fulfillment confirmed"
                  : "Add payment"}
              </button>
            )}
          </section>}

          {isAuthenticated && fulfillmentComplete && <section className="checkout-card">
            <h2><Banknote size={19} /> Payment</h2>
            <div className="checkout-choice-grid">
              <button
                className={paymentChoice === "receipt" ? "is-selected" : ""}
                onClick={() => setPaymentChoice("receipt")}
                type="button"
              >
                <ReceiptText size={20} />
                <span><strong>Pay on my side</strong><small>Upload bank/mobile receipt</small></span>
              </button>
              <button
                className={paymentChoice === "system" ? "is-selected" : ""}
                onClick={() => setPaymentChoice("system")}
                type="button"
              >
                <Banknote size={20} />
                <span><strong>Pay with system</strong><small>Gateway integration not configured</small></span>
              </button>
              <button
                className={paymentChoice === "cod" ? "is-selected" : ""}
                onClick={() => setPaymentChoice("cod")}
                type="button"
              >
                <Truck size={20} />
                <span><strong>Pay on delivery/pickup</strong><small>Cash or agreed payment</small></span>
              </button>
            </div>

            {paymentChoice === "receipt" && (
              <div className="checkout-payment-details">
                {accounts.map((account) => (
                  <div className="checkout-payment-account" key={account.id}>
                    <strong>{account.type === "bank" ? "Bank" : "Mobile money"} · {account.provider}</strong>
                    <span>{account.accountName}</span>
                    <code>{account.accountNumber}</code>
                  </div>
                ))}
                {accounts.length === 0 && (
                  <p role="note">No active payment account is configured. Contact support.</p>
                )}
                <div className="checkout-fields">
                  <label>
                    Payment method
                    <select
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target.value as "bank_transfer" | "mobile_money",
                        )
                      }
                      value={paymentMethod}
                    >
                      {accounts.some((account) => account.type === "bank") && (
                        <option value="bank_transfer">Bank transfer</option>
                      )}
                      {accounts.some((account) => account.type === "mobile_money") && (
                        <option value="mobile_money">Mobile money</option>
                      )}
                    </select>
                  </label>
                  <label>
                    Transaction reference
                    <input name="transactionReference" minLength={3} maxLength={120} required />
                  </label>
                  <label className="checkout-full-field">
                    Upload receipt
                    <input
                      accept="application/pdf,image/jpeg,image/png"
                      name="receipt"
                      required
                      type="file"
                    />
                  </label>
                </div>
              </div>
            )}
            {paymentChoice === "system" && (
              <p className="checkout-payment-unavailable" role="note">
                <Upload size={18} /> Pay with system is not configured yet. Choose receipt or pay on delivery/pickup.
              </p>
            )}
          </section>}

          {isAuthenticated && fulfillmentComplete && <section className="checkout-card">
            <h2><MessageCircle size={19} /> Message merchants</h2>
            {merchantIds.map(([ownerId, merchantName]) => (
              <div className="checkout-merchant-row" key={ownerId}>
                <div>
                  <strong>{merchantName}</strong>
                  {items.find((item) => item.product.ownerId === ownerId)?.product.owner?.phone && (
                    <a
                      href={`tel:${items.find((item) => item.product.ownerId === ownerId)?.product.owner?.phone}`}
                    >
                      <Phone size={14} /> Call merchant
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => messageMerchant(ownerId, merchantName)}
                >
                  <MessageCircle size={16} /> Send message
                </button>
              </div>
            ))}
            <div className="checkout-fields">
              <label>
                Subject
                <input
                  maxLength={200}
                  onChange={(event) => setMerchantSubject(event.target.value)}
                  value={merchantSubject}
                />
              </label>
              <label className="checkout-full-field">
                Message
                <textarea
                  maxLength={4000}
                  onChange={(event) => setMerchantMessage(event.target.value)}
                  rows={3}
                  value={merchantMessage}
                />
              </label>
            </div>
            {merchantNotice && <p role="status">{merchantNotice}</p>}
          </section>}

          {error && <p className="checkout-error" role="alert">{error}</p>}
          <button
            className="checkout-submit"
            disabled={busy || (isAuthenticated && paymentChoice === "system")}
            onClick={
              isAuthenticated
                ? undefined
                : () => window.location.assign("/login?callbackUrl=%2Fcheckout")
            }
            type={isAuthenticated ? "submit" : "button"}
          >
            {busy
              ? "Placing order…"
              : isAuthenticated
                ? `Place order · ${subtotal.toLocaleString("en-RW")} RWF`
                : `Sign in to place order · ${subtotal.toLocaleString("en-RW")} RWF`}
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>Order summary</h2>
          {items.map((item) => (
            <article key={item.product.id}>
              <Image
                alt=""
                height={64}
                src={item.product.image}
                unoptimized
                width={64}
              />
              <div>
                <strong>{item.product.name}</strong>
                <small>{item.quantity} × {item.product.price.toLocaleString("en-RW")} RWF</small>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.product.id)}
              >
                Remove
              </button>
              <div className="checkout-summary-quantity">
                <button type="button" onClick={() => changeQuantity(item.product.id, -1)}>−</button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => changeQuantity(item.product.id, 1)}>+</button>
              </div>
            </article>
          ))}
          <div className="checkout-summary-total">
            <span>Subtotal</span>
            <strong>{subtotal.toLocaleString("en-RW")} RWF</strong>
          </div>
          <div className="checkout-call-actions">
            <a href="tel:0788390989"><Phone size={16} /> Call Super Admin</a>
            <a href="tel:0788390989"><Truck size={16} /> Call Delivery</a>
          </div>
        </aside>
      </div>
    </main>
  );
}
