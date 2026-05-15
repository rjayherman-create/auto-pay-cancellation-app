import { createRoot } from "react-dom/client";
import { loadRuntimeAuthConfig } from "./lib/auth-mode";
import "./index.css";

const appImport = import("./App");

const hasBuildTimeAuthConfig =
  import.meta.env.DEV || !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();

if (hasBuildTimeAuthConfig) {
  await Promise.race([
    loadRuntimeAuthConfig(),
    new Promise((resolve) => window.setTimeout(resolve, 250)),
  ]);
} else {
  await loadRuntimeAuthConfig();
}

const { default: App } = await appImport;

createRoot(document.getElementById("root")!).render(<App />);
