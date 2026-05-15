import { createRoot } from "react-dom/client";
import { loadRuntimeAuthConfig } from "./lib/auth-mode";
import "./index.css";

await loadRuntimeAuthConfig();

const { default: App } = await import("./App");

createRoot(document.getElementById("root")!).render(<App />);
