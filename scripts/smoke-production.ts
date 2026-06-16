/**
 * Judge-style production smoke test for Render backend + Vercel dashboard config.
 * Usage: pnpm smoke:production
 */
const SKILL_URL = process.env.SKILL_URL ?? "https://covenant-skill.onrender.com";
const WEB_URL = process.env.WEB_URL ?? "https://covenant-web-mu.vercel.app";

interface Check {
  name: string;
  ok: boolean;
  detail?: string;
}

const checks: Check[] = [];

function pass(name: string, detail?: string) {
  checks.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name: string, detail?: string) {
  checks.push({ name, ok: false, detail });
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { res, body };
}

async function main() {
  console.log("\n=== COVENANT production smoke test ===\n");
  console.log(`Skill: ${SKILL_URL}`);
  console.log(`Web:   ${WEB_URL}\n`);

  // Health
  try {
    const { res, body } = await fetchJson(`${SKILL_URL}/health`);
    const h = body as Record<string, unknown>;
    if (res.ok && h.status === "ok" && h.attester) {
      const att = h.attester as Record<string, unknown>;
      pass("GET /health", `chain ${(h.rpc as Record<string, unknown>)?.chainId}, attester match=${att.match}`);
    } else {
      fail("GET /health", `status ${res.status}: ${JSON.stringify(body).slice(0, 120)}`);
    }
  } catch (e) {
    fail("GET /health", e instanceof Error ? e.message : String(e));
  }

  // REST API endpoints
  for (const path of ["/api/agents", "/api/covenants", "/api/decisions?limit=5", "/api/reputation"]) {
    try {
      const { res, body } = await fetchJson(`${SKILL_URL}${path}`);
      if (res.ok) {
        pass(`GET ${path}`, `HTTP ${res.status}`);
      } else {
        fail(`GET ${path}`, `HTTP ${res.status}: ${JSON.stringify(body).slice(0, 120)}`);
      }
    } catch (e) {
      fail(`GET ${path}`, e instanceof Error ? e.message : String(e));
    }
  }

  // SSE headers
  try {
    const res = await fetch(`${SKILL_URL}/api/events/decisions`, {
      headers: { Accept: "text/event-stream" },
    });
    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.includes("text/event-stream")) {
      pass("GET /api/events/decisions", "SSE stream opens");
      await res.body?.cancel();
    } else {
      fail("GET /api/events/decisions", `HTTP ${res.status}, content-type=${ct}`);
    }
  } catch (e) {
    fail("GET /api/events/decisions", e instanceof Error ? e.message : String(e));
  }

  // CORS preflight from Vercel origin
  try {
    const res = await fetch(`${SKILL_URL}/api/agents`, {
      method: "OPTIONS",
      headers: {
        Origin: WEB_URL,
        "Access-Control-Request-Method": "GET",
      },
    });
    const allowOrigin = res.headers.get("access-control-allow-origin");
    if (allowOrigin === "*" || allowOrigin === WEB_URL) {
      pass("CORS preflight", `allow-origin=${allowOrigin ?? "implicit"}`);
    } else {
      fail("CORS preflight", `allow-origin=${allowOrigin ?? "missing"}`);
    }
  } catch (e) {
    fail("CORS preflight", e instanceof Error ? e.message : String(e));
  }

  // Vercel dashboard loads
  try {
    const res = await fetch(WEB_URL);
    const html = await res.text();
    if (res.ok && html.includes("COVENANT")) {
      pass("Vercel dashboard", `HTTP ${res.status}`);
    } else {
      fail("Vercel dashboard", `HTTP ${res.status}`);
    }
  } catch (e) {
    fail("Vercel dashboard", e instanceof Error ? e.message : String(e));
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n=== ${checks.length - failed.length}/${checks.length} passed ===\n`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
