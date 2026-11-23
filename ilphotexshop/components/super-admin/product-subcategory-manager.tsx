"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function ProductSubcategoryManager() {
  const router = useRouter();
  const [category, setCategory] = useState("technology");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/products/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, name, slug }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || "Subcategory could not be saved");
      setName("");
      setSlug("");
      setMessage("Subcategory saved.");
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Subcategory could not be saved");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="super-admin-announcement-form-grid" onSubmit={submit}>
      <label>
        Category
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="technology">Technology</option>
          <option value="fashion">Fashion</option>
          <option value="home">Home</option>
          <option value="beauty">Beauty</option>
        </select>
      </label>
      <label>
        Name
        <input maxLength={160} minLength={2} onChange={(event) => setName(event.target.value)} required value={name} />
      </label>
      <label>
        Slug
        <input maxLength={180} onChange={(event) => setSlug(event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required value={slug} />
      </label>
      <div className="super-admin-confirm-actions">
        <button className="super-admin-primary-action" disabled={busy} type="submit">{busy ? "Saving…" : "Add subcategory"}</button>
        {message && <span className="super-admin-row-action-error">{message}</span>}
      </div>
    </form>
  );
}

export function ProductSubcategoryStatusAction({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    await fetch("/api/super-admin/products/subcategories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    }).finally(() => setBusy(false));
    router.refresh();
  }
  return <button className="super-admin-row-action" disabled={busy} onClick={toggle} type="button">{busy ? "Saving…" : isActive ? "Deactivate" : "Activate"}</button>;
}
