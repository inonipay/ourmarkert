import type { Metadata } from "next";
import SupportWidget from "@/components/marketplace/support-widget";

export const metadata: Metadata = {
  title: "All-In-One Support | ILPhotoX Shop",
};

export default function AllInOneSupportPage() {
  return (
    <main className="all-in-one-support-page">
      <div className="all-in-one-support-shell">
        <SupportWidget language="en" openByDefault />
      </div>
    </main>
  );
}