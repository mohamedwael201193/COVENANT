# covenant-skill

COVENANT skill engine — deterministic preflight, attestation signing, and Pharos chain layer.

For agents, use the MCP wrapper:

```bash
npx covenant-mcp
```

This package powers the MCP server. See [packages/mcp/README.md](../mcp/README.md) for install and tool docs.

## Bins

- `covenant-mcp` — MCP stdio server (same as `covenant-mcp`)
- `covenant-skill` — REST + optional MCP (production host)

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `PHAROS_RPC_URL` | Yes* | Pharos Atlantic RPC (*defaults to public testnet RPC) |
| `GOPLUS_APP_KEY` / `GOPLUS_APP_SECRET` | For preflight | Counterparty risk |
| `DEPLOYER_PRIVATE_KEY` | For signing | GuardedExecutor attester |
