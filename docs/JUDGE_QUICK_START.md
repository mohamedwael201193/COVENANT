# Judge Quick Start

Verify COVENANT in **under 60 seconds** — no wallet required.

## 1. Install (15s)

```bash
npx -y covenant-mcp init
```

Restart Cursor.

## 2. Paste one prompt (30s)

**[`docs/prompts/judge-demo.md`](./prompts/judge-demo.md)**

Agent will: install → discover 17 tools → run health → reputation → simulate → preflight → print report.

**Pass:** 17 tools, `covenant_health` → `status: ok`, chainId `688689`, preflight verdict returned.

## 3. Verify proof (15s)

| Check | URL |
|---|---|
| Proof doc | [proofs/PROOF_OF_EXECUTION.md](./proofs/PROOF_OF_EXECUTION.md) |
| Transaction | https://atlantic.pharosscan.xyz/tx/0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c |
| Receipt API | https://covenant-skill.onrender.com/api/receipt/1 |

**Pass:** Tx status Success, receipt `verdict: ALLOW`.

## 4. Live wallet demo (optional, ~90s)

Paste **[`docs/prompts/video-demo.md`](./prompts/video-demo.md)**. Provide your wallet address when asked. MetaMask on **chain 688689**.

## API health

```bash
curl -s https://covenant-skill.onrender.com/health
npm view covenant-mcp version   # 0.2.7
```

## Demo addresses

Personal wallets in proof docs are for verification only. Use your own addresses in prompts — see README § Demo Addresses.
