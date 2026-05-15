export const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
export const isDevBypassEnabled = true;
// Temporary global bypass: disable Clerk so the app can load without Clerk auth.
export const isClerkEnabled = !isDevBypassEnabled && !!clerkPubKey;
