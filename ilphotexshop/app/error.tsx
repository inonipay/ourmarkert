"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketplace page failed to load", error);
  }, [error]);

  return (
    <main className="page-error">
      <div>
        <p className="eyebrow">ILPhotoX Shop</p>
        <h1>The marketplace is temporarily unavailable.</h1>
        <p>Please try again in a moment.</p>
        <button className="button button-primary" type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
