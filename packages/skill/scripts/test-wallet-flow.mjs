#!/usr/bin/env node
/** API smoke test for wallet session flow (run against deployed skill API). */
import { privateKeyToAccount } from "viem/accounts";

const API = (process.env.COVENANT_API_URL ?? "https://covenant-skill.onrender.com").replace(/\/$/, "");
const account = privateKeyToAccount(
  "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
);

async function main() {
  console.log("API:", API);

  const connectRes = await fetch(`${API}/api/sessions/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: account.address }),
  });
  const connect = await connectRes.json();
  if (!connectRes.ok) throw new Error(JSON.stringify(connect));
  console.log("connect OK", connect.nonce);

  const signature = await account.signMessage({ message: connect.message });
  const sessionRes = await fetch(`${API}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: account.address,
      signature,
      message: connect.message,
      nonce: connect.nonce,
      permissions: ["execute", "preflight"],
      durationDays: 7,
    }),
  });
  const session = await sessionRes.json();
  if (!sessionRes.ok) throw new Error(JSON.stringify(session));
  console.log("sessionId:", session.sessionId);

  const challengeRes = await fetch(
    `${API}/api/sessions/challenge?address=${account.address}&nonce=${connect.nonce}`,
  );
  console.log("challenge lookup (expect 404 after use):", challengeRes.status);

  console.log("\nPASS — session flow API works");
  console.log("sessionId:", session.sessionId);
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
