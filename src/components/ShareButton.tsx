"use client";

import { useState } from "react";

type Props = { url: string; title: string; text: string; className?: string; label?: string };

/** Partage natif du mobile ; à défaut, copie du lien. */
export function ShareButton({ url, title, text, className, label = "Partager" }: Props) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url, title, text });
        return;
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return; // partage annulé
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", url);
    }
  }

  return (
    <button type="button" className={className} onClick={onClick} aria-live="polite">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
        <path d="M16 6l-4-4-4 4" />
        <path d="M12 2v14" />
      </svg>
      <span>{copied ? "Lien copié" : label}</span>
    </button>
  );
}
