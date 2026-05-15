export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface RuntimeAuthConfig {
  clerkPublishableKey?: string | null;
  clerkProxyUrl?: string | null;
  enableDevBypass?: boolean;
}

let runtimeAuthConfig: RuntimeAuthConfig = {};

function readTrimmed(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function applyAuthMode() {
  clerkPubKey =
    readTrimmed(runtimeAuthConfig.clerkPublishableKey) ??
    readTrimmed(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  clerkProxyUrl =
    readTrimmed(runtimeAuthConfig.clerkProxyUrl) ??
    readTrimmed(import.meta.env.VITE_CLERK_PROXY_URL);

  const hasClerkPublishableKey = !!clerkPubKey;
  isDevBypassEnabled =
    import.meta.env.DEV ||
    runtimeAuthConfig.enableDevBypass === true ||
    import.meta.env.VITE_ENABLE_DEV_BYPASS === "true" ||
    !hasClerkPublishableKey;
  isClerkEnabled = !isDevBypassEnabled && hasClerkPublishableKey;
}

export async function loadRuntimeAuthConfig() {
  if (typeof window === "undefined") return;

  try {
    const res = await fetch(`${basePath}/api/auth/config`, {
      credentials: "include",
    });
    if (res.ok) {
      runtimeAuthConfig = await res.json();
    }
  } catch {
    runtimeAuthConfig = {};
  }

  applyAuthMode();
}

export let clerkPubKey: string | null = null;
export let clerkProxyUrl: string | null = null;
export let isDevBypassEnabled = false;
export let isClerkEnabled = false;

applyAuthMode();
