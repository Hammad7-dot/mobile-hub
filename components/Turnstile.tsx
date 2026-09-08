"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const turnstileAvailable = Boolean(siteKey) || process.env.NODE_ENV === "development";

export default function Turnstile({ action, onTokenChange, resetKey }: {
  action: "checkout" | "sell_phone";
  onTokenChange: (token: string) => void;
  resetKey: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!siteKey || !container.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      action,
      theme: "light",
      size: "flexible",
      callback: (token: string) => onTokenChange(token),
      "expired-callback": () => onTokenChange(""),
      "error-callback": () => onTokenChange(""),
    });
  }, [action, onTokenChange]);

  useEffect(() => {
    if (!siteKey && process.env.NODE_ENV === "development") onTokenChange("development-bypass");
  }, [onTokenChange]);

  useEffect(() => {
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      onTokenChange("");
    }
  }, [resetKey, onTokenChange]);

  useEffect(() => () => {
    if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
    widgetId.current = null;
  }, []);

  if (!siteKey) return process.env.NODE_ENV === "development"
    ? <p className="turnstile-note">Bot protection uses development bypass locally.</p>
    : <p className="form-error">Checkout protection is not configured. Please contact the store.</p>;

  return <div className="turnstile-wrap">
    <Script
      id="cloudflare-turnstile"
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
      onReady={renderWidget}
      onError={() => onTokenChange("")}
    />
    <div ref={container}/>
  </div>;
}
