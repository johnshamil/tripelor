"use client";

type Gtag = (...args: unknown[]) => void;

function gtagFn(): Gtag | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { gtag?: Gtag }).gtag;
}

export function reportGoogleAdsConversion(
  sendTo: string | undefined,
  options: {
    value?: number;
    currency?: string;
    transactionId?: string;
    onComplete?: () => void;
  } = {},
) {
  const finish = (() => {
    let done = false;
    return () => {
      if (done) return;
      done = true;
      options.onComplete?.();
    };
  })();

  const gtag = gtagFn();
  if (!sendTo || !sendTo.startsWith("AW-") || typeof gtag !== "function") {
    finish();
    return;
  }

  const payload: Record<string, unknown> = {
    send_to: sendTo,
    event_callback: finish,
  };
  if (typeof options.value === "number") payload.value = options.value;
  if (options.currency) payload.currency = options.currency;
  if (options.transactionId) payload.transaction_id = options.transactionId;

  gtag("event", "conversion", payload);
  window.setTimeout(finish, 1200);
}
