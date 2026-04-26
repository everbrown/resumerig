import FingerprintJS from "@fingerprintjs/fingerprintjs";

const TRIAL_USED_KEY = "rr_trial_used";
const TRIAL_COUNT_KEY = "rr_preview_count";

/**
 * Allowlisted email addresses bypass all anti-abuse checks
 * (fingerprint, IP rate limit, disposable email block, persistent trial flag).
 * Used for owner/test accounts.
 */
export const ABUSE_ALLOWLIST = new Set<string>([
  "djcoolmike@gmail.com",
]);

export function isAllowlistedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ABUSE_ALLOWLIST.has(email.trim().toLowerCase());
}

const FINGERPRINT_KEY = "rr_fp";
const COOKIE_NAME = "rr_trial";

/**
 * Disposable / temporary email providers we block at signup and free preview.
 * Conservative list — we only block well-known throwaway services.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "sharklasers.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "getnada.com",
  "nada.email",
  "maildrop.cc",
  "dispostable.com",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "mintemail.com",
  "mohmal.com",
  "mytemp.email",
  "spambox.us",
  "spam4.me",
  "tmail.io",
  "tmpmail.org",
  "tmpmail.net",
  "moakt.com",
  "tempr.email",
  "spamgourmet.com",
  "mailcatch.com",
  "mailnesia.com",
  "emailondeck.com",
  "harakirimail.com",
  "incognitomail.com",
  "anonbox.net",
  "luxusmail.org",
  "33mail.com",
  "burnermail.io",
  "mail-temporaire.fr",
  "jetable.org",
  "mt2015.com",
]);

export function isDisposableEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at === -1) return false;
  const domain = trimmed.slice(at + 1);
  return DISPOSABLE_DOMAINS.has(domain);
}

export function getEmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at === -1) return null;
  return trimmed.slice(at + 1) || null;
}

/* ---------------- Cookies ---------------- */

function setCookie(name: string, value: string, days: number) {
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // ignore (SSR / privacy mode)
  }
}

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/* ---------------- Trial flag ---------------- */

export function hasUsedFreeTrial(): boolean {
  try {
    if (localStorage.getItem(TRIAL_USED_KEY) === "1") return true;
    if (getCookie(COOKIE_NAME) === "1") return true;
    const raw = localStorage.getItem(TRIAL_COUNT_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    if (Number.isFinite(n) && n >= 3) return true;
  } catch {
    // ignore
  }
  return false;
}

export function markTrialUsed() {
  try {
    localStorage.setItem(TRIAL_USED_KEY, "1");
  } catch {
    // ignore
  }
  setCookie(COOKIE_NAME, "1", 365);
}

/* ---------------- Fingerprint ---------------- */

let fpPromise: Promise<string | null> | null = null;

export async function getFingerprint(): Promise<string | null> {
  // Cached value in localStorage avoids re-running the agent.
  try {
    const cached = localStorage.getItem(FINGERPRINT_KEY);
    if (cached) return cached;
  } catch {
    // ignore
  }

  if (!fpPromise) {
    fpPromise = (async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const id = result.visitorId;
        try {
          localStorage.setItem(FINGERPRINT_KEY, id);
        } catch {
          // ignore
        }
        return id;
      } catch {
        return null;
      }
    })();
  }
  return fpPromise;
}
