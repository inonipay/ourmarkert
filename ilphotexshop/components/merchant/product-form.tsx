"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ProductCategory } from "@prisma/client";

export type MerchantProductFormValues = {
  id?: string;
  name?: string;
  nameRw?: string | null;
  nameFr?: string | null;
  category?: ProductCategory;
  price?: number;
  previousPrice?: number | null;
  image?: string;
  location?: string;
  stockQuantity?: number;
};

const categories: { value: ProductCategory; label: string }[] = [
  { value: "technology", label: "Technology" },
  { value: "fashion", label: "Fashion" },
  { value: "home", label: "Home" },
  { value: "beauty", label: "Beauty" },
];

export default function MerchantProductForm({
  product,
}: {
  product?: MerchantProductFormValues;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const editing = Boolean(product?.id);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const formData = new FormData(event.currentTarget);
    const previousPriceValue = String(formData.get("previousPrice") ?? "").trim();
    const body = {
      name: String(formData.get("name") ?? "").trim(),
      nameRw: String(formData.get("nameRw") ?? "").trim() || null,
      nameFr: String(formData.get("nameFr") ?? "").trim() || null,
      category: formData.get("category"),
      price: Number(formData.get("price")),
      previousPrice: previousPriceValue ? Number(previousPriceValue) : null,
      image: String(formData.get("image") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      stockQuantity: Number(formData.get("stockQuantity")),
    };

    try {
      const response = await fetch(
        editing
          ? `/api/seller/products/${encodeURIComponent(product?.id ?? "")}`
          : "/api/seller/products",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string; details?: { fieldErrors?: Record<string, string[]> } }
        | null;
      if (!response.ok) {
        const detail = Object.values(result?.details?.fieldErrors ?? {})
          .flat()
          .find(Boolean);
        throw new Error(detail || result?.error || "Product could not be saved.");
      }

      if (editing) {
        setNotice("Product updated and moved to unpublished review.");
        router.refresh();
      } else {
        router.replace("/merchant/products?status=unpublished");
      }
    } catch (caught) {
      console.error("Could not save merchant product", caught);
      setError(
        caught instanceof Error ? caught.message : "Product could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="merchant-product-form" onSubmit={handleSubmit}>
      <div className="merchant-form-grid">
        <div className="merchant-form-field is-wide">
          <label htmlFor="merchant-product-name">Product name</label>
          <input
            autoComplete="off"
            defaultValue={product?.name ?? ""}
            id="merchant-product-name"
            maxLength={160}
            minLength={2}
            name="name"
            required
          />
        </div>
        <div className="merchant-form-field">
          <label htmlFor="merchant-product-name-rw">Kinyarwanda name</label>
          <input
            defaultValue={product?.nameRw ?? ""}
            id="merchant-product-name-rw"
            maxLength={160}
            name="nameRw"
          />
        </div>
        <div className="merchant-form-field">
          <label htmlFor="merchant-product-name-fr">French name</label>
          <input
            defaultValue={product?.nameFr ?? ""}
            id="merchant-product-name-fr"
            maxLength={160}
            name="nameFr"
          />
        </div>
        <div className="merchant-form-field">
          <label htmlFor="merchant-product-category">Category</label>
          <select
            defaultValue={product?.category ?? "technology"}
            id="merchant-product-category"
            name="category"
            required
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div className="merchant-form-field">
          <label htmlFor="merchant-product-price">Price (RWF)</label>
          <input
            defaultValue={product?.price ?? ""}
            id="merchant-product-price"
            max={1_000_000_000}
            min={1}
            name="price"
            required
            step={1}
            type="number"
          />
        </div>
        <div className="merchant-form-field">
          <label htmlFor="merchant-product-previous-price">Previous price (RWF)</label>
          <input
            defaultValue={product?.previousPrice ?? ""}
            id="merchant-product-previous-price"
            max={1_000_000_000}
            min={1}
            name="previousPrice"
            step={1}
            type="number"
          />
          <small>Leave blank if the product is not discounted.</small>
        </div>
        <div className="merchant-form-field">
          <label htmlFor="merchant-product-stock">Stock quantity</label>
          <input
            defaultValue={product?.stockQuantity ?? 0}
            id="merchant-product-stock"
            max={1_000_000}
            min={0}
            name="stockQuantity"
            required
            step={1}
            type="number"
          />
        </div>
        <div className="merchant-form-field">
          <label htmlFor="merchant-product-location">Shop location</label>
          <input
            defaultValue={product?.location ?? ""}
            id="merchant-product-location"
            maxLength={120}
            minLength={2}
            name="location"
            required
          />
        </div>
        <div className="merchant-form-field is-wide">
          <label htmlFor="merchant-product-image">Product image URL</label>
          <input
            defaultValue={product?.image ?? ""}
            id="merchant-product-image"
            maxLength={2048}
            name="image"
            placeholder="https://images.unsplash.com/…"
            required
            type="url"
          />
          <small>Use a secure image URL from images.unsplash.com.</small>
        </div>
      </div>

      {editing && (
        <div className="merchant-info-banner" role="note">
          Saving changes sends this listing back for review and hides it from
          the storefront until it is published again.
        </div>
      )}

      <div className="merchant-form-footer">
        {error && <p aria-live="polite" className="merchant-form-error">{error}</p>}
        {notice && <p aria-live="polite" className="merchant-form-success">{notice}</p>}
        <Link className="merchant-secondary-action" href="/merchant/products">
          Cancel
        </Link>
        <button className="merchant-primary-action" disabled={busy} type="submit">
          {busy ? "Saving…" : editing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
