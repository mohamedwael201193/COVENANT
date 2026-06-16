/**
 * Render static-site build: sets VITE_API_URL from RENDER_EXTERNAL_URL host reference.
 * Invoked by render.yaml buildCommand when VITE_API_URL is a bare hostname.
 */
import { execSync } from "node:child_process";

const skillHost = process.env.VITE_API_URL ?? process.env.RENDER_SKILL_URL ?? "";
const healthHost = process.env.VITE_HEALTH_URL ?? skillHost;

if (skillHost && !skillHost.startsWith("http")) {
  process.env.VITE_API_URL = `https://${skillHost}/api`;
}
if (healthHost && !healthHost.startsWith("http")) {
  process.env.VITE_HEALTH_URL = `https://${healthHost}`;
}

execSync("pnpm exec vite build", { stdio: "inherit", cwd: import.meta.dirname + "/.." });
