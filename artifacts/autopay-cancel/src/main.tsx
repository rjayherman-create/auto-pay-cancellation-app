import { createRoot } from "react-dom/client";
import { loadRuntimeAuthConfig } from "./lib/auth-mode";
import "./index.css";

const hasBuildTimeAuthConfig =
  import.meta.env.DEV || !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();

if (hasBuildTimeAuthConfig) {
  await Promise.race([
    loadRuntimeAuthConfig(),
    new Promise((resolve) => window.setTimeout(resolve, 800)),
  ]);
} else {
  await loadRuntimeAuthConfig();
}

const { default: App } = await import("./App");

createRoot(document.getElementById("root")!).render(<App />);
