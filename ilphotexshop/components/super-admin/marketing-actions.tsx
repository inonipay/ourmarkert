"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

async function postJson(url: string, body: object) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(result?.error || "Action failed");
}

export function CouponCreator() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await postJson("/api/super-admin/marketing/coupons", {
        code: String(form.get("code") ?? "").toUpperCase(),
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? "") || undefined,
        discountType: form.get("discountType"),
        discountValue: Number(form.get("discountValue")),
        minimumSubtotal: Number(form.get("minimumSubtotal") || 0),
        maximumDiscount: form.get("maximumDiscount") ? Number(form.get("maximumDiscount")) : null,
        usageLimit: form.get("usageLimit") ? Number(form.get("usageLimit")) : null,
        perUserLimit: Number(form.get("perUserLimit") || 1),
        startsAt: new Date(String(form.get("startsAt"))).toISOString(),
        endsAt: new Date(String(form.get("endsAt"))).toISOString(),
      });
      setMessage("Coupon created.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Coupon could not be created");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="super-admin-announcement-form-grid" onSubmit={submit}>
      <label>Code<input name="code" required minLength={3} maxLength={64} pattern="[A-Za-z0-9_-]+" /></label>
      <label>Name<input name="name" required minLength={2} maxLength={160} /></label>
      <label>Description<input name="description" maxLength={500} /></label>
      <label>Discount type<select name="discountType"><option value="percentage">Percentage</option><option value="fixed_amount">Fixed amount</option></select></label>
      <label>Discount value<input name="discountValue" required min={1} max={100000000} type="number" /></label>
      <label>Minimum subtotal<input name="minimumSubtotal" min={0} type="number" defaultValue={0} /></label>
      <label>Maximum discount<input name="maximumDiscount" min={1} type="number" /></label>
      <label>Usage limit<input name="usageLimit" min={1} type="number" /></label>
      <label>Per-user limit<input name="perUserLimit" min={1} type="number" defaultValue={1} /></label>
      <label>Starts at<input name="startsAt" required type="datetime-local" /></label>
      <label>Ends at<input name="endsAt" required type="datetime-local" /></label>
      <div className="super-admin-confirm-actions"><button className="super-admin-primary-action" disabled={busy} type="submit">{busy ? "Saving…" : "Create coupon"}</button>{message && <span className="super-admin-row-action-error">{message}</span>}</div>
    </form>
  );
}

export function CampaignCreator() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await postJson("/api/super-admin/marketing/campaigns", {
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? "") || undefined,
        kind: form.get("kind"),
        status: form.get("status"),
        startsAt: new Date(String(form.get("startsAt"))).toISOString(),
        endsAt: new Date(String(form.get("endsAt"))).toISOString(),
      });
      setMessage("Campaign created.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Campaign could not be created");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="super-admin-announcement-form-grid" onSubmit={submit}>
      <label>Name<input name="name" required minLength={2} maxLength={160} /></label>
      <label>Description<input name="description" maxLength={1000} /></label>
      <label>Type<select name="kind"><option value="discount">Discount</option><option value="special_offer">Special offer</option><option value="seasonal">Seasonal</option><option value="featured">Featured</option></select></label>
      <label>Status<select name="status"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="paused">Paused</option></select></label>
      <label>Starts at<input name="startsAt" required type="datetime-local" /></label>
      <label>Ends at<input name="endsAt" required type="datetime-local" /></label>
      <div className="super-admin-confirm-actions"><button className="super-admin-primary-action" disabled={busy} type="submit">{busy ? "Saving…" : "Create campaign"}</button>{message && <span className="super-admin-row-action-error">{message}</span>}</div>
    </form>
  );
}

export function BannerCreator() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await postJson("/api/super-admin/marketing/banners", {
        title: String(form.get("title") ?? ""),
        subtitle: String(form.get("subtitle") ?? "") || undefined,
        imageUrl: String(form.get("imageUrl") ?? ""),
        hrefUrl: String(form.get("hrefUrl") ?? "") || null,
        placement: form.get("placement"),
        status: form.get("status"),
        position: Number(form.get("position") || 0),
        startsAt: new Date(String(form.get("startsAt"))).toISOString(),
        endsAt: new Date(String(form.get("endsAt"))).toISOString(),
      });
      setMessage("Banner created.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Banner could not be created");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="super-admin-announcement-form-grid" onSubmit={submit}>
      <label>Title<input name="title" required minLength={2} maxLength={160} /></label>
      <label>Subtitle<input name="subtitle" maxLength={500} /></label>
      <label>Image URL<input name="imageUrl" required type="url" maxLength={2048} /></label>
      <label>Link URL<input name="hrefUrl" type="url" maxLength={2048} /></label>
      <label>Placement<select name="placement"><option value="homepage">Homepage</option><option value="category">Category</option><option value="checkout">Checkout</option></select></label>
      <label>Status<select name="status"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="paused">Paused</option></select></label>
      <label>Position<input name="position" min={0} max={100} type="number" defaultValue={0} /></label>
      <label>Starts at<input name="startsAt" required type="datetime-local" /></label>
      <label>Ends at<input name="endsAt" required type="datetime-local" /></label>
      <div className="super-admin-confirm-actions"><button className="super-admin-primary-action" disabled={busy} type="submit">{busy ? "Saving…" : "Create banner"}</button>{message && <span className="super-admin-row-action-error">{message}</span>}</div>
    </form>
  );
}

export function FeaturedMerchantManager({
  merchants,
}: {
  merchants: { id: string; name: string; email: string; isFeaturedMerchant: boolean }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await postJson("/api/super-admin/marketing/featured-merchants", {
        merchantId: String(form.get("merchantId") ?? ""),
        position: Number(form.get("position") || 0),
        startsAt: new Date(String(form.get("startsAt"))).toISOString(),
        endsAt: form.get("endsAt") ? new Date(String(form.get("endsAt"))).toISOString() : null,
      });
      setMessage("Merchant featured.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Merchant could not be featured");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="super-admin-announcement-form-grid" onSubmit={submit}>
      <label>Merchant<select name="merchantId" required><option value="">Select merchant</option>{merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name} · {merchant.email}</option>)}</select></label>
      <label>Position<input name="position" type="number" min={0} max={100} defaultValue={0} /></label>
      <label>Starts at<input name="startsAt" required type="datetime-local" /></label>
      <label>Ends at<input name="endsAt" type="datetime-local" /></label>
      <div className="super-admin-confirm-actions"><button className="super-admin-primary-action" disabled={busy} type="submit">{busy ? "Saving…" : "Feature merchant"}</button>{message && <span className="super-admin-row-action-error">{message}</span>}</div>
    </form>
  );
}

export function FeaturedMerchantToggle({
  merchantId,
  isFeatured,
}: {
  merchantId: string;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    await fetch("/api/super-admin/marketing/featured-merchants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId, isFeatured: !isFeatured }),
    }).finally(() => setBusy(false));
    router.refresh();
  }
  return <button className={`super-admin-row-action${isFeatured ? " is-warning" : ""}`} disabled={busy} onClick={toggle} type="button">{busy ? "Saving…" : isFeatured ? "Unfeature" : "Feature"}</button>;
}

export function MarketingStatusToggle({
  kind,
  id,
  status,
}: {
  kind: "coupon" | "campaign" | "banner";
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const nextStatus = status === "active" ? "paused" : "active";
  async function toggle() {
    setBusy(true);
    const endpoint =
      kind === "coupon"
        ? "/api/super-admin/marketing/coupons"
        : kind === "campaign"
          ? "/api/super-admin/marketing/campaigns"
          : "/api/super-admin/marketing/banners";
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus }),
    }).finally(() => setBusy(false));
    router.refresh();
  }
  return <button className="super-admin-row-action" disabled={busy} onClick={toggle} type="button">{busy ? "Saving…" : status === "active" ? "Pause" : "Activate"}</button>;
}
