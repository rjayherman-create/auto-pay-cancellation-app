function readTrimmed(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getClerkPublishableKey(): string | null {
  return (
    readTrimmed(process.env.CLERK_PUBLISHABLE_KEY) ??
    readTrimmed(process.env.VITE_CLERK_PUBLISHABLE_KEY)
  );
}

export function getClerkProxyUrl(): string | null {
  return (
    readTrimmed(process.env.CLERK_PROXY_URL) ??
    readTrimmed(process.env.VITE_CLERK_PROXY_URL)
  );
}

export function hasClerkPublishableKey(): boolean {
  return getClerkPublishableKey() !== null;
}

export function hasClerkSecretKey(): boolean {
  return readTrimmed(process.env.CLERK_SECRET_KEY) !== null;
}

export function hasClerkRuntimeConfig(): boolean {
  return hasClerkPublishableKey() && hasClerkSecretKey();
}

export function isDevBypassAllowed(): boolean {
  return process.env.NODE_ENV === "development" || process.env.ENABLE_DEV_BYPASS === "true";
}

export function getPublicAuthConfig() {
  return {
    clerkPublishableKey: getClerkPublishableKey(),
    clerkProxyUrl: getClerkProxyUrl(),
    enableDevBypass: isDevBypassAllowed(),
  };
}
