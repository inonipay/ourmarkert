"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { SuperAdminRecordKind } from "@/lib/data-access/super-admin-records";

type SuperAdminRecordRowActionsProps = {
  id: string;
  kind: SuperAdminRecordKind;
  status: string;
  isSuspended?: boolean;
  isAnonymized?: boolean;
};

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "fulfilled"
  | "cancelled";

export default function SuperAdminRecordRowActions({
  id,
  kind,
  status,
  isSuspended = false,
  isAnonymized = false,
}: SuperAdminRecordRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [selectedRole, setSelectedRole] = useState(status);
  const [confirmRoleChange, setConfirmRoleChange] = useState(false);
  const [merchantAction, setMerchantAction] = useState<
    "suspend" | "reactivate" | null
  >(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [confirmKycErase, setConfirmKycErase] = useState(false);
  const [kycEraseReason, setKycEraseReason] = useState("");
  const [kycEraseConfirmation, setKycEraseConfirmation] = useState("");
  const [error, setError] = useState("");

  async function updateProduct(isPublished: boolean) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(id)}/publish`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "Product status could not be updated.");
      }
      router.refresh();
    } catch (caught) {
      console.error("Could not update product publication status", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Product status could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateOrder(nextStatus: OrderStatus) {
    setBusy(true);
    setError("");
    setConfirmCancel(false);
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "Order status could not be updated.");
      }
      router.refresh();
    } catch (caught) {
      console.error("Could not update order status", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Order status could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateUserRole() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/users/${encodeURIComponent(id)}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: selectedRole }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "User role could not be updated.");
      }
      setConfirmRoleChange(false);
      router.refresh();
    } catch (caught) {
      console.error("Could not update user role", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "User role could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateMerchantAccess(
    nextAction: "suspend" | "reactivate",
  ) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/merchants/${encodeURIComponent(id)}/access`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: nextAction, reason: suspensionReason }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "Merchant access could not be updated.");
      }
      setMerchantAction(null);
      setSuspensionReason("");
      router.refresh();
    } catch (caught) {
      console.error("Could not update merchant access", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Merchant access could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function eraseMerchantKyc() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/merchants/${encodeURIComponent(id)}/kyc`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: kycEraseReason,
            confirmation: kycEraseConfirmation,
          }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "Merchant KYC data could not be erased.");
      }
      setConfirmKycErase(false);
      setKycEraseReason("");
      setKycEraseConfirmation("");
      router.refresh();
    } catch (caught) {
      console.error("Could not erase merchant KYC data", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Merchant KYC data could not be erased.",
      );
    } finally {
      setBusy(false);
    }
  }

  let action: ReactNode = null;
  if (kind === "users" && isAnonymized) {
    action = (
      <small className="super-admin-role-confirm-note">
        Profile anonymized; access cannot be restored.
      </small>
    );
  } else if (kind === "users" && status !== "super_admin") {
    action = (
      <span className="super-admin-user-actions">
        <span className="super-admin-user-role-controls">
          <label className="super-admin-visually-hidden" htmlFor={`role-${id}`}>
            Role for {id}
          </label>
          <select
            disabled={busy || confirmRoleChange || (status === "seller" && isSuspended)}
            id={`role-${id}`}
            onChange={(event) => {
              setSelectedRole(event.target.value);
              setConfirmRoleChange(false);
              setError("");
            }}
            value={selectedRole}
          >
            <option value="customer">Customer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
          {confirmRoleChange ? (
            <span className="super-admin-confirm-actions">
              <button
                className="super-admin-row-action"
                disabled={busy}
                onClick={updateUserRole}
                type="button"
              >
                {busy ? "Saving…" : "Confirm role"}
              </button>
              <button
                className="super-admin-row-action is-warning"
                disabled={busy}
                onClick={() => setConfirmRoleChange(false)}
                type="button"
              >
                Keep role
              </button>
            </span>
          ) : (
            <button
              className="super-admin-row-action"
              disabled={busy || isSuspended || selectedRole === status}
              onClick={() => setConfirmRoleChange(true)}
              type="button"
            >
              Review role change
            </button>
          )}
          {confirmRoleChange && (
            <small className="super-admin-role-confirm-note">
              Change {status.replace("_", " ")} to {selectedRole.replace("_", " ")}?
              Access updates immediately.
            </small>
          )}
          {status === "seller" && isSuspended && (
            <small className="super-admin-role-confirm-note">
              Reactivate the merchant before changing their role.
            </small>
          )}
        </span>
        {status === "seller" && (
          <span className="super-admin-merchant-access-controls">
            {merchantAction ? (
              <>
                <small className="super-admin-role-confirm-note">
                  {merchantAction === "suspend"
                    ? "This blocks access and hides published listings. Existing orders stay unchanged."
                    : "Previously hidden products remain unpublished until an admin reviews them."}
                </small>
                <textarea
                  aria-label={
                    merchantAction === "suspend"
                      ? "Reason for suspending merchant"
                      : "Reason for reactivating merchant"
                  }
                  maxLength={500}
                  onChange={(event) => setSuspensionReason(event.target.value)}
                  placeholder={
                    merchantAction === "suspend"
                      ? "Reason for suspension (required)"
                      : "Reason for reactivation (required)"
                  }
                  rows={2}
                  value={suspensionReason}
                />
                <span className="super-admin-confirm-actions">
                  <button
                    className={`super-admin-row-action${merchantAction === "suspend" ? " is-danger" : ""}`}
                    disabled={busy || suspensionReason.trim().length < 3}
                    onClick={() => updateMerchantAccess(merchantAction)}
                    type="button"
                  >
                    {busy
                      ? "Saving…"
                      : merchantAction === "suspend"
                        ? "Confirm suspension"
                        : "Confirm reactivation"}
                  </button>
                  <button
                    className="super-admin-row-action is-muted"
                    disabled={busy}
                    onClick={() => setMerchantAction(null)}
                    type="button"
                  >
                    Keep status
                  </button>
                </span>
              </>
            ) : (
              <button
                className={`super-admin-row-action${isSuspended ? "" : " is-danger"}`}
                disabled={busy}
                onClick={() => {
                  setError("");
                  setMerchantAction(isSuspended ? "reactivate" : "suspend");
                }}
                type="button"
              >
                {isSuspended ? "Review reactivation" : "Suspend merchant"}
              </button>
            )}
            {isSuspended && !merchantAction && (
              confirmKycErase ? (
                <span className="super-admin-merchant-erase-panel">
                  <small className="super-admin-role-confirm-note">
                    Permanently remove KYC files and personal profile fields. Orders
                    and audit history are retained. This cannot be undone.
                  </small>
                  <textarea
                    aria-label="Reason for removing merchant KYC data"
                    maxLength={500}
                    onChange={(event) => setKycEraseReason(event.target.value)}
                    placeholder="Reason (required)"
                    rows={2}
                    value={kycEraseReason}
                  />
                  <input
                    aria-label="Type DELETE_KYC to confirm erasure"
                    onChange={(event) => setKycEraseConfirmation(event.target.value)}
                    placeholder="Type DELETE_KYC"
                    value={kycEraseConfirmation}
                  />
                  <span className="super-admin-confirm-actions">
                    <button
                      className="super-admin-row-action is-danger"
                      disabled={
                        busy ||
                        kycEraseReason.trim().length < 3 ||
                        kycEraseConfirmation !== "DELETE_KYC"
                      }
                      onClick={eraseMerchantKyc}
                      type="button"
                    >
                      {busy ? "Erasing…" : "Confirm erasure"}
                    </button>
                    <button
                      className="super-admin-row-action is-muted"
                      disabled={busy}
                      onClick={() => setConfirmKycErase(false)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </span>
                </span>
              ) : (
                <button
                  className="super-admin-row-action is-danger"
                  disabled={busy}
                  onClick={() => {
                    setError("");
                    setConfirmKycErase(true);
                  }}
                  type="button"
                >
                  Delete KYC &amp; anonymize
                </button>
              )
            )}
          </span>
        )}
      </span>
    );
  } else if (kind === "products") {
    const isPublished = status === "Published";
    action = (
      <button
        className={`super-admin-row-action${isPublished ? " is-warning" : ""}`}
        disabled={busy}
        onClick={() => updateProduct(!isPublished)}
        type="button"
      >
        {busy ? "Saving…" : isPublished ? "Hide product" : "Publish product"}
      </button>
    );
  } else if (kind === "orders") {
    if (status === "pending") {
      action = confirmCancel ? (
        <span className="super-admin-confirm-actions">
          <button
            className="super-admin-row-action is-danger"
            disabled={busy}
            onClick={() => updateOrder("cancelled")}
            type="button"
          >
            Confirm cancel
          </button>
          <button
            className="super-admin-row-action is-muted"
            disabled={busy}
            onClick={() => setConfirmCancel(false)}
            type="button"
          >
            Keep order
          </button>
        </span>
      ) : (
        <span className="super-admin-confirm-actions">
          <button
            className="super-admin-row-action"
            disabled={busy}
            onClick={() => updateOrder("confirmed")}
            type="button"
          >
            Confirm
          </button>
          <button
            className="super-admin-row-action is-danger"
            disabled={busy}
            onClick={() => setConfirmCancel(true)}
            type="button"
          >
            Cancel
          </button>
        </span>
      );
    } else if (status === "confirmed") {
      action = (
        <button
          className="super-admin-row-action"
          disabled={busy}
          onClick={() => updateOrder("processing")}
          type="button"
        >
          {busy ? "Saving…" : "Start processing"}
        </button>
      );
    } else if (status === "processing") {
      action = (
        <button
          className="super-admin-row-action"
          disabled={busy}
          onClick={() => updateOrder("shipped")}
          type="button"
        >
          {busy ? "Saving…" : "Mark shipped"}
        </button>
      );
    } else if (status === "shipped") {
      action = (
        <button
          className="super-admin-row-action"
          disabled={busy}
          onClick={() => updateOrder("delivered")}
          type="button"
        >
          {busy ? "Saving…" : "Mark delivered"}
        </button>
      );
    } else if (status === "delivered") {
      action = (
        <button
          className="super-admin-row-action"
          disabled={busy}
          onClick={() => updateOrder("fulfilled")}
          type="button"
        >
          {busy ? "Saving…" : "Mark fulfilled"}
        </button>
      );
    }
  }

  if (!action) return null;

  return (
    <span className="super-admin-record-row-actions">
      {action}
      {error && (
        <span aria-live="polite" className="super-admin-row-action-error">
          {error}
        </span>
      )}
    </span>
  );
}
