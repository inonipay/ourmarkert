"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AddMerchantStaff({
  merchants,
  users,
}: {
  merchants: { id: string; name: string; email: string }[];
  users: { id: string; name: string; email: string; role: string }[];
}) {
  const router = useRouter();
  const [merchantId, setMerchantId] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("support");
  const [canManageProducts, setCanManageProducts] = useState(false);
  const [canManageOrders, setCanManageOrders] = useState(false);
  const [canManageStaff, setCanManageStaff] = useState(false);
  const [canManageFinancialProfile, setCanManageFinancialProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/merchants/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          userId,
          role,
          canManageProducts,
          canManageOrders,
          canManageStaff,
          canManageFinancialProfile,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || "Staff could not be added");
      setMessage("Merchant staff updated.");
      setMerchantId("");
      setUserId("");
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Staff could not be added");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="super-admin-announcement-form-grid" onSubmit={submit}>
      <label>Merchant<select required value={merchantId} onChange={(event) => setMerchantId(event.target.value)}><option value="">Select merchant</option>{merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name} · {merchant.email}</option>)}</select></label>
      <label>User<select required value={userId} onChange={(event) => setUserId(event.target.value)}><option value="">Select account</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email} ({user.role})</option>)}</select></label>
      <label>Staff role<select value={role} onChange={(event) => {
        const nextRole = event.target.value;
        setRole(nextRole);
        setCanManageProducts(nextRole === "owner" || nextRole === "manager" || nextRole === "operations");
        setCanManageOrders(nextRole === "owner" || nextRole === "manager" || nextRole === "operations");
        setCanManageStaff(nextRole === "owner" || nextRole === "manager");
        setCanManageFinancialProfile(nextRole === "owner" || nextRole === "finance");
      }}><option value="owner">Owner</option><option value="manager">Manager</option><option value="operations">Operations</option><option value="support">Support</option><option value="finance">Finance</option></select></label>
      <fieldset className="super-admin-inline-fieldset">
        <legend>Permissions</legend>
        <label><input checked={canManageProducts} onChange={(event) => setCanManageProducts(event.target.checked)} type="checkbox" /> Products</label>
        <label><input checked={canManageOrders} onChange={(event) => setCanManageOrders(event.target.checked)} type="checkbox" /> Orders</label>
        <label><input checked={canManageStaff} onChange={(event) => setCanManageStaff(event.target.checked)} type="checkbox" /> Staff</label>
        <label><input checked={canManageFinancialProfile} onChange={(event) => setCanManageFinancialProfile(event.target.checked)} type="checkbox" /> Financial profile</label>
      </fieldset>
      <div className="super-admin-confirm-actions"><button className="super-admin-primary-action" disabled={busy} type="submit">{busy ? "Saving…" : "Add staff"}</button>{message && <span className="super-admin-row-action-error">{message}</span>}</div>
    </form>
  );
}

export function SetMerchantStaffStatus({ id, status }: { id: string; status: "active" | "inactive" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function update(nextStatus: "active" | "inactive") {
    setBusy(true);
    await fetch(`/api/super-admin/merchants/staff/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    }).finally(() => setBusy(false));
    router.refresh();
  }
  return <button className="super-admin-row-action" disabled={busy} onClick={() => update(status === "active" ? "inactive" : "active")} type="button">{busy ? "Saving…" : status === "active" ? "Deactivate" : "Activate"}</button>;
}

export function SetFinancialVerified({ id, isVerified }: { id: string; isVerified: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function update() {
    setBusy(true);
    await fetch(`/api/super-admin/merchants/financial-profiles/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: !isVerified }),
    }).finally(() => setBusy(false));
    router.refresh();
  }
  return <button className={`super-admin-row-action${isVerified ? " is-warning" : ""}`} disabled={busy} onClick={update} type="button">{busy ? "Saving…" : isVerified ? "Mark unverified" : "Verify"}</button>;
}

export function AddMerchantFinancialProfile({
  merchants,
}: {
  merchants: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [merchantId, setMerchantId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [currency, setCurrency] = useState("RWF");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/merchants/financial-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          accountName,
          bankName,
          bankAccountNumber,
          mobileMoneyProvider,
          mobileMoneyNumber,
          currency,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || "Financial profile could not be saved");
      setMessage("Financial profile saved.");
      setMerchantId("");
      setAccountName("");
      setBankName("");
      setBankAccountNumber("");
      setMobileMoneyProvider("");
      setMobileMoneyNumber("");
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Financial profile could not be saved");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="super-admin-announcement-form-grid" onSubmit={handleSubmit}>
      <label>Merchant<select required value={merchantId} onChange={(event) => setMerchantId(event.target.value)}><option value="">Select merchant</option>{merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name} · {merchant.email}</option>)}</select></label>
      <label>Account name<input required maxLength={160} value={accountName} onChange={(event) => setAccountName(event.target.value)} /></label>
      <label>Bank name<input maxLength={160} value={bankName} onChange={(event) => setBankName(event.target.value)} /></label>
      <label>Bank account number<input maxLength={100} value={bankAccountNumber} onChange={(event) => setBankAccountNumber(event.target.value)} /></label>
      <label>Mobile money provider<input maxLength={100} value={mobileMoneyProvider} onChange={(event) => setMobileMoneyProvider(event.target.value)} /></label>
      <label>Mobile money number<input maxLength={32} value={mobileMoneyNumber} onChange={(event) => setMobileMoneyNumber(event.target.value)} /></label>
      <label>Currency<input required maxLength={3} minLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></label>
      <div className="super-admin-confirm-actions"><button className="super-admin-primary-action" disabled={busy} type="submit">{busy ? "Saving…" : "Save profile"}</button>{message && <span className="super-admin-row-action-error">{message}</span>}</div>
    </form>
  );
}
