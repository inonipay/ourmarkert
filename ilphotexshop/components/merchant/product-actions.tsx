"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { useState } from "react";

export default function MerchantProductActions({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function deleteProduct() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/seller/products/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(result?.error || "Product could not be deleted.");
      }
      router.refresh();
    } catch (caught) {
      console.error("Could not delete merchant product", caught);
      setError(
        caught instanceof Error ? caught.message : "Product could not be deleted.",
      );
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="merchant-row-action-group">
      <Link
        aria-label="View product details"
        className="merchant-table-action"
        href={`/merchant/products/${encodeURIComponent(id)}`}
      >
        <Eye aria-hidden="true" size={15} /> View
      </Link>
      <Link
        aria-label="Edit product"
        className="merchant-table-action"
        href={`/merchant/products/${encodeURIComponent(id)}/edit`}
      >
        Edit
      </Link>
      {confirming ? (
        <>
          <button
            className="merchant-table-action is-danger"
            disabled={busy}
            onClick={deleteProduct}
            type="button"
          >
            {busy ? "Deleting…" : "Confirm delete"}
          </button>
          <button
            className="merchant-table-action is-cancel"
            disabled={busy}
            onClick={() => setConfirming(false)}
            type="button"
          >
            Keep
          </button>
        </>
      ) : (
        <button
          className="merchant-table-action is-danger"
          onClick={() => setConfirming(true)}
          type="button"
        >
          Delete
        </button>
      )}
      {error && <span aria-live="polite" className="merchant-form-error">{error}</span>}
    </span>
  );
}
