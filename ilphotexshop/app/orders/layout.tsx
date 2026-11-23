import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import "./orders.css";

export default function CustomerOrdersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="customer-orders-shell">
      <header className="customer-orders-header">
        <Link aria-label="ILPhotoX Shop home" href="/">
          <Image
            alt=""
            height={42}
            src="/ilphotox-shop-logo.png"
            width={42}
          />
          <strong>ILPhotoX Shop</strong>
        </Link>
        <nav aria-label="Customer navigation">
          <Link className="customer-orders-home-link" href="/">
            Continue shopping
          </Link>
          <Link className="customer-orders-nav-link" href="/orders">
            My orders
          </Link>
        </nav>
      </header>
      <main className="customer-orders-main">{children}</main>
      <footer className="customer-orders-footer">
        ILPhotoX Shop · Customer orders
      </footer>
    </div>
  );
}
