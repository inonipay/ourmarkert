"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { UserRole } from "@prisma/client";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { Product } from "@/data/products";
import {
  formatMoney,
  translate,
  translateProduct,
  type Language,
} from "@/lib/marketplace-i18n";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartDrawerProps = {
  language: Language;
  items: CartItem[];
  userRole: UserRole | null;
  cartAdjusted: boolean;
  cartStorageFailed: boolean;
  onClose: () => void;
  onChangeQuantity: (productId: string, change: number) => void;
  onOrderPlaced: () => void;
  onRemove: (productId: string) => void;
};

function createIdempotencyKey() {
  if (typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getOrderId(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "order" in payload &&
    payload.order &&
    typeof payload.order === "object" &&
    "id" in payload.order &&
    typeof payload.order.id === "string"
  ) {
    return payload.order.id;
  }
  return null;
}

export default function CartDrawer({
  language,
  items,
  userRole,
  cartAdjusted,
  cartStorageFailed,
  onClose,
  onChangeQuantity,
  onOrderPlaced,
  onRemove,
}: CartDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsAuthentication, setNeedsAuthentication] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const idempotencyKey = useRef<{ fingerprint: string; key: string } | null>(
    null,
  );
  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setNeedsAuthentication(false);

    const formData = new FormData(event.currentTarget);
    const orderInput = {
      items: items.map(({ product, quantity }) => ({
        productId: product.id,
        quantity,
      })),
      deliveryName: String(formData.get("deliveryName") ?? "").trim(),
      deliveryPhone: String(formData.get("deliveryPhone") ?? "").trim(),
      deliveryAddress: String(formData.get("deliveryAddress") ?? "").trim(),
    };
    const phoneDigitCount = orderInput.deliveryPhone.replace(/\D/g, "").length;
    if (orderInput.items.length > 25) {
      setErrorMessage(t("orderItemLimit"));
      return;
    }
    if (phoneDigitCount < 7 || phoneDigitCount > 15) {
      setErrorMessage(t("invalidDeliveryPhone"));
      return;
    }
    const fingerprint = JSON.stringify(orderInput);
    setIsSubmitting(true);
    try {
      if (idempotencyKey.current?.fingerprint !== fingerprint) {
        idempotencyKey.current = {
          fingerprint,
          key: createIdempotencyKey(),
        };
      }
      const requestKey = idempotencyKey.current?.key;
      if (!requestKey) {
        throw new Error("Could not create an order idempotency key");
      }
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey,
        },
        body: fingerprint,
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        const apiError =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "";
        if (response.status === 401) {
          setNeedsAuthentication(true);
        } else if (response.status === 403) {
          setErrorMessage(t("customerAccountRequired"));
        } else if (response.status === 409 && apiError.includes("stock")) {
          setErrorMessage(t("inventoryUnavailable"));
        } else {
          setErrorMessage(t("orderCreateError"));
        }
        return;
      }

      const createdOrderId = getOrderId(payload);
      if (!createdOrderId) {
        throw new Error("Order creation response did not contain an order ID");
      }
      setOrderId(createdOrderId);
      onOrderPlaced();
    } catch (error) {
      console.error("Failed to place customer order", error);
      setErrorMessage(t("orderCreateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="drawer-layer">
      <button
        className="drawer-backdrop"
        type="button"
        onClick={onClose}
        aria-label={t("closeCart")}
      />
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="drawer-header">
          <div>
            <p className="eyebrow">{t("cartKicker")}</p>
            <h2 id="cart-title">{t("cartTitle")}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label={t("closeCart")}
          >
            <X size={20} />
          </button>
        </div>

        {(cartAdjusted || cartStorageFailed) && (
          <div className="cart-notice" role="status">
            {cartAdjusted && <p>{t("cartStorageWarning")}</p>}
            {cartStorageFailed && <p>{t("cartStorageUnavailable")}</p>}
          </div>
        )}

        {orderId ? (
          <div className="cart-order-success" role="status">
            <span className="cart-empty-icon">
              <ShoppingBag size={26} />
            </span>
            <h3>{t("orderCreated")}</h3>
            <p>
              {t("orderNumber").replace(
                "{number}",
                orderId.slice(0, 8).toUpperCase(),
              )}
            </p>
            <Link
              className="button button-primary"
              href={`/orders/${encodeURIComponent(orderId)}`}
              onClick={onClose}
            >
              {t("viewOrder")}
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">
              <ShoppingBag size={26} />
            </span>
            <h3>{t("emptyCartTitle")}</h3>
            <p>{t("emptyCartBody")}</p>
            <button
              className="button button-primary"
              type="button"
              onClick={onClose}
            >
              {t("browseProducts")}
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(({ product, quantity }) => {
                const copy = translateProduct(product, language);
                const stockLimit = Math.min(
                  product.stockQuantity ?? 100,
                  100,
                );

                return (
                  <article className="cart-item" key={product.id}>
                    <div
                      className="cart-item-image"
                      role="img"
                      aria-label={copy.name}
                      style={{ backgroundImage: `url("${product.image}")` }}
                    />
                    <div className="cart-item-details">
                      <h3>{copy.name}</h3>
                      <p>{formatMoney(product.price, language)}</p>
                      <div className="quantity-control">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onChangeQuantity(product.id, -1)}
                          aria-label={t("decreaseQuantity").replace(
                            "{product}",
                            copy.name,
                          )}
                        >
                          <Minus size={14} />
                        </button>
                        <span aria-live="polite">{quantity}</span>
                        <button
                          type="button"
                          disabled={isSubmitting || quantity >= stockLimit}
                          onClick={() => onChangeQuantity(product.id, 1)}
                          aria-label={t("increaseQuantity").replace(
                            "{product}",
                            copy.name,
                          )}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="remove-item-button"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onRemove(product.id)}
                      aria-label={t("removeProduct").replace(
                        "{product}",
                        copy.name,
                      )}
                    >
                      <Trash2 size={17} />
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="cart-summary">
              <div className="cart-subtotal">
                <span>{t("subtotal")}</span>
                <strong>{formatMoney(subtotal, language)}</strong>
              </div>
              <p>{t("orderPaymentNotice")}</p>

              {needsAuthentication || userRole === null ? (
                <div className="cart-auth-prompt">
                  <p>{t("signInToPlaceOrder")}</p>
                  <Link
                    className="button button-primary"
                    href="/login?callbackUrl=%2F%3Fcheckout%3D1"
                  >
                    {t("signIn")}
                  </Link>
                </div>
              ) : userRole !== "customer" ? (
                <div className="cart-auth-prompt">
                  <p>{t("customerAccountRequired")}</p>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/?checkout=1" })}
                  >
                    {t("signOut")}
                  </button>
                </div>
              ) : (
                <form className="cart-checkout-form" onSubmit={placeOrder}>
                  <h3>{t("checkoutDeliveryHeading")}</h3>
                  <label>
                    <span>{t("deliveryName")}</span>
                    <input
                      autoComplete="name"
                      name="deliveryName"
                      minLength={2}
                      maxLength={100}
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                  <label>
                    <span>{t("deliveryPhone")}</span>
                    <input
                      autoComplete="tel"
                      name="deliveryPhone"
                      type="tel"
                      minLength={7}
                      maxLength={32}
                      pattern="^\+?[0-9][0-9 ()-]*$"
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                  <label>
                    <span>{t("deliveryAddress")}</span>
                    <textarea
                      autoComplete="street-address"
                      name="deliveryAddress"
                      minLength={5}
                      maxLength={500}
                      rows={2}
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                  {errorMessage && (
                    <p className="cart-form-error" role="alert">
                      {errorMessage}
                    </p>
                  )}
                  <button
                    className="button button-primary checkout-button"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("placingOrder") : t("placeOrder")}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
