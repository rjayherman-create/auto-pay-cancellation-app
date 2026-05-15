export const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
export const isDevBypassEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_BYPASS === "true";
export const isClerkEnabled = !isDevBypassEnabled && !!clerkPubKey;
