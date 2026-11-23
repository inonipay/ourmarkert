"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  UserCircle,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  superAdminSections,
  superAdminSearchItems,
} from "@/components/super-admin/navigation";

type SuperAdminAppShellProps = {
  children: ReactNode;
  userName: string;
  userEmail: string;
};

export default function SuperAdminAppShell({
  children,
  userName,
  userEmail,
}: SuperAdminAppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openedSection, setOpenedSection] = useState<{
    id: string | null;
    pathname: string;
  } | null>(null);
  const [query, setQuery] = useState("");

  const routeSection =
    superAdminSections.find(
      (section) =>
        pathname === section.href || pathname.startsWith(`${section.href}/`),
    ) ??
    (pathname.startsWith("/super-admin/records/")
      ? superAdminSections.find(
          (section) => section.id === pathname.split("/")[3],
        )
      : undefined);
  const activeSection =
    (openedSection?.pathname === pathname
      ? openedSection.id
        ? superAdminSections.find(
            (section) => section.id === openedSection.id,
          ) ?? null
        : null
      : routeSection ?? superAdminSections[0]);
  const searchResults = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return [];
    return superAdminSearchItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(search) ||
          item.sectionLabel.toLowerCase().includes(search),
      )
      .slice(0, 6);
  }, [query]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchResults[0]) {
      router.push(searchResults[0].href);
      setQuery("");
    }
  }

  const initials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SA";

  return (
    <div
      className={`super-admin-app${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
    >
      <header className="super-admin-topbar">
        <button
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          className="super-admin-mobile-toggle"
          onClick={() => setMobileOpen((open) => !open)}
          type="button"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <form
          className="super-admin-search"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <Search aria-hidden="true" size={18} />
          <input
            aria-label="Search dashboard sections"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users, products, orders…"
            value={query}
          />
          {query && (
            <button
              aria-label="Clear search"
              className="super-admin-search-clear"
              onClick={() => setQuery("")}
              type="button"
            >
              <X size={16} />
            </button>
          )}
          {query && (
            <div className="super-admin-search-results" role="listbox">
              {searchResults.length ? (
                searchResults.map((item) => (
                  <Link
                    href={item.href}
                    key={item.href}
                    onClick={() => {
                      setQuery("");
                      setMobileOpen(false);
                    }}
                    role="option"
                  >
                    <span>{item.label}</span>
                    <small>{item.sectionLabel}</small>
                  </Link>
                ))
              ) : (
                <p>No matching dashboard sections</p>
              )}
            </div>
          )}
        </form>

        <div className="super-admin-topbar-actions">
          <Link
            aria-label="Notification activity"
            className="super-admin-icon-link"
            href="/super-admin/communication/notifications"
            title="Notification activity"
          >
            <Bell aria-hidden="true" size={19} />
          </Link>
          <Link
            aria-label="Open account profile"
            className="super-admin-icon-link"
            href="/super-admin/account"
            title="Account"
          >
            <UserCircle aria-hidden="true" size={20} />
          </Link>
          <Link
            className="super-admin-store-link"
            href="/"
            rel="noreferrer"
            target="_blank"
          >
            View storefront <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>

      <button
        aria-label="Close navigation"
        className="super-admin-nav-backdrop"
        onClick={() => setMobileOpen(false)}
        type="button"
      />

      <div className="super-admin-workspace">
        <aside aria-label="Super admin navigation" className="super-admin-sidebar">
          <div className="super-admin-brand">
            <Link
              aria-label="ILPhotoX Shop dashboard"
              className="super-admin-brand-link"
              href="/super-admin/dashboard"
            >
              <Image
                alt=""
                height={38}
                src="/ilphotox-shop-logo.png"
                width={38}
              />
              <span className="super-admin-brand-copy">
                <strong>ILPhotoX Shop</strong>
                <small>SUPER ADMIN</small>
              </span>
            </Link>
            <button
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="super-admin-collapse-button"
              onClick={() => setCollapsed((value) => !value)}
              type="button"
            >
              {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          </div>

          <nav aria-label="Dashboard sections" className="super-admin-main-nav">
            <p className="super-admin-nav-caption">WORKSPACE</p>
            {superAdminSections.map((section) => {
              const Icon = section.icon;
              const selected = activeSection?.id === section.id;
              return (
                <div className="super-admin-nav-group" key={section.id}>
                  <button
                    aria-expanded={selected}
                    className={`super-admin-main-nav-item${selected ? " is-active" : ""}`}
                    onClick={() => {
                      if (collapsed) setCollapsed(false);
                      setOpenedSection({
                        id: selected ? null : section.id,
                        pathname,
                      });
                    }}
                    title={collapsed ? section.label : undefined}
                    type="button"
                  >
                    <Icon aria-hidden="true" size={19} />
                    <span>{section.label}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className="super-admin-main-nav-chevron"
                      size={15}
                    />
                  </button>
                  {selected && (
                    <nav
                      aria-label={`${section.label} pages`}
                      className="super-admin-subnav"
                    >
                      {section.items.map((item) => {
                        if (!item.href) {
                          return (
                            <span
                              aria-disabled="true"
                              className="super-admin-subnav-link is-disabled"
                              key={item.label}
                              title="This module is not available yet"
                            >
                              <span>{item.label}</span>
                              <small>Unavailable</small>
                            </span>
                          );
                        }
                        const [itemPath, itemQuery = ""] = item.href.split("?");
                        const currentQuery = new URLSearchParams(
                          searchParams.toString(),
                        );
                        [
                          "page",
                          "from",
                          "to",
                          "q",
                          "pageSize",
                          "category",
                        ].forEach((key) => currentQuery.delete(key));
                        const active =
                          pathname === itemPath &&
                          (itemQuery
                            ? currentQuery.toString() ===
                              new URLSearchParams(itemQuery).toString()
                            : currentQuery.toString() === "");
                        return (
                          <Link
                            aria-current={active ? "page" : undefined}
                            className={`super-admin-subnav-link${active ? " is-active" : ""}`}
                            href={item.href}
                            key={item.href}
                            onClick={() => setMobileOpen(false)}
                          >
                            <span>{item.label}</span>
                            {active && <ChevronRight aria-hidden="true" size={14} />}
                          </Link>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="super-admin-sidebar-account">
            <div aria-hidden="true" className="super-admin-avatar">
              {initials}
            </div>
            <div className="super-admin-account-copy">
              <strong>{userName}</strong>
              <span>{userEmail}</span>
              <small>Super Administrator</small>
            </div>
            <button
              aria-label="Sign out"
              className="super-admin-signout"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              type="button"
            >
              <LogOut size={17} />
            </button>
          </div>
        </aside>

        <main className="super-admin-content">{children}</main>
      </div>
      <footer className="super-admin-global-footer">
        ILPhotoX Shop · Super admin workspace
      </footer>
    </div>
  );
}
