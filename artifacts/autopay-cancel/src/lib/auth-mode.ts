export const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
export const isDevBypassEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_BYPASS === "true";
// Clerk is disabled when:
// 1) running in dev or with VITE_ENABLE_DEV_BYPASS=true (intentional bypass), or
// 2) no VITE_CLERK_PUBLISHABLE_KEY is configured.
// This avoids Clerk network calls in bypass mode and prevents Clerk hook/widget crashes.
export const isClerkEnabled = !isDevBypassEnabled && !!clerkPubKey;
