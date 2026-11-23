"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SuperAdminFeaturedProductAction({
  productId,
  isFeatured,
}: {
  productId: string;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateFeaturedState() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/super-admin/products/${encodeURIComponent(productId)}/featured`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeatured: !isFeatured }),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Featured status could not be updated.");
      }
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Featured status could not be updated.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="super-admin-featured-product-action">
      <button
        aria-pressed={isFeatured}
        className={`super-admin-row-action${isFeatured ? " is-warning" : ""}`}
        disabled={pending}
        onClick={updateFeaturedState}
        type="button"
      >
        {pending ? "Saving…" : isFeatured ? "Remove feature" : "Feature product"}
      </button>
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
