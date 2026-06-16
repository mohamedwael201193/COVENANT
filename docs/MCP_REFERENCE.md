# COVENANT MCP Reference

The skill server (`packages/skill`) exposes **9 MCP tools** over stdio when `MCP_STDIO_ENABLED=true` (default on local TTY; disabled on Render).

Server metadata: `{ name: "covenant-skill", version: "0.1.0" }`

Tool results are returned as JSON text in MCP `content[0].text`. Errors set `isError: true`.

---

## Tool Summary

| Tool | Mutates chain | Description |
|---|---|---|
| `registerIdentity` | Yes | Register agent on IdentityRegistry |
| `setCovenant` | Yes | Set covenant hash + IPFS URI |
| `preflight` | Signs only | Deterministic preflight + ALLOW attestation |
| `simulate` | No | eth_call + eth_estimateGas |
| `verifyCounterparty` | No | GoPlus risk read |
| `attestOutcome` | Yes | Oracle reputation write |
| `getReceipt` | No | Read DecisionLog receipt |
| `reputation` | No | Read Trust Capital score |
| `rotateKey` | Yes | Rotate agent key |

---

## 1. `registerIdentity`

Register an agent key with metadata URI on `IdentityRegistry`.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "agent": { "type": "string", "description": "Agent address (0x + 40 hex)" },
    "metadataURI": { "type": "string", "description": "IPFS or HTTPS metadata URI" },
    "ownerPrivateKey": { "type": "string", "description": "Owner wallet private key" }
  },
  "required": ["agent", "metadataURI", "ownerPrivateKey"]
}
```

### Response

```json
{
  "txHash": "0x...",
  "agent": "0x...",
  "metadataURI": "ipfs://..."
}
```

---

## 2. `setCovenant`

Set covenant hash and IPFS URI for an agent on `CovenantRegistry`.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "agent": { "type": "string" },
    "covenant": {
      "type": "object",
      "description": "CovenantTerms v1 — see schema below"
    },
    "ipfsURI": { "type": "string" },
    "ownerPrivateKey": { "type": "string" }
  },
  "required": ["agent", "covenant", "ipfsURI", "ownerPrivateKey"]
}
```

### Covenant object (`covenant`)

| Field | Type | Required |
|---|---|---|
| `version` | `"1"` | Yes |
| `agent` | address | Yes |
| `owner` | address | Yes |
| `allowlist` | address[] | Yes |
| `denylist` | address[] | Yes |
| `baseMaxValueWei` | string | Yes |
| `tierLimits` | `{ tier: 0-4, maxValueWei: string }[]` | Yes |
| `minCounterpartyTier` | 0-4 | Yes |
| `timeWindows` | `{ startHourUtc, endHourUtc }[]` | Yes |
| `requiredChecks` | `("simulation" \| "goplus")[]` | Yes |
| `label` | string | No |
| `createdAt` | ISO string | Yes |

### Response

```json
{
  "txHash": "0x...",
  "covenantHash": "0x...",
  "tierCurveRef": "0x...",
  "ipfsURI": "ipfs://..."
}
```

---

## 3. `preflight`

Run deterministic preflight (rules + simulation + GoPlus) and sign ALLOW if permitted.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "intent": {
      "type": "object",
      "properties": {
        "agent": { "type": "string" },
        "target": { "type": "string" },
        "data": { "type": "string" },
        "value": { "type": "string" },
        "nonce": { "type": "string" }
      }
    },
    "covenant": { "type": "object" },
    "covenantHash": { "type": "string" },
    "counterpartyTier": { "type": "number" },
    "deadlineSeconds": { "type": "number" }
  },
  "required": ["intent", "covenant", "covenantHash"]
}
```

| Field | Default | Notes |
|---|---|---|
| `deadlineSeconds` | `3600` | Attestation expiry |
| `counterpartyTier` | optional | For minCounterpartyTier rule |

### Response

```json
{
  "verdict": "ALLOW",
  "intentHash": "0x...",
  "violations": [],
  "simulation": {
    "success": true,
    "gasEstimate": "21000",
    "traceAvailable": false
  },
  "risk": {
    "source": "goplus",
    "status": "unknown",
    "details": {}
  },
  "explanation": "...",
  "attestation": {
    "agent": "0x...",
    "intentHash": "0x...",
    "covenantHash": "0x...",
    "verdict": 2,
    "deadline": "1718662800",
    "v": 27,
    "r": "0x...",
    "s": "0x..."
  }
}
```

`attestation` omitted unless `verdict` is `"ALLOW"`.

---

## 4. `simulate`

Simulate an intent via `eth_call` and `eth_estimateGas`.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "intent": { "type": "object" },
    "from": { "type": "string", "description": "Optional msg.sender override" }
  },
  "required": ["intent"]
}
```

### Response

```json
{
  "success": true,
  "returnData": "0x",
  "gasEstimate": "21000",
  "traceAvailable": false
}
```

---

## 5. `verifyCounterparty`

GoPlus counterparty and contract risk read.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "address": { "type": "string" }
  },
  "required": ["address"]
}
```

### Response

```json
{
  "source": "goplus",
  "status": "safe",
  "details": {
    "addressStatus": "safe",
    "tokenStatus": "unknown"
  }
}
```

Status values: `safe` | `warn` | `malicious` | `unknown`

On Pharos Atlantic, token security often returns `unknown` (chain not fully supported by GoPlus).

---

## 6. `attestOutcome`

Oracle write to `ReputationRegistry` with DecisionLog provenance.

Requires server `DEPLOYER_PRIVATE_KEY` (attester/oracle role).

### Input schema

```json
{
  "type": "object",
  "properties": {
    "agent": { "type": "string" },
    "score": { "type": "string" },
    "tier": { "type": "number" },
    "decisionIds": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["agent", "score", "tier", "decisionIds"]
}
```

### Response

```json
{
  "txHash": "0x...",
  "agent": "0x...",
  "score": "110",
  "tier": 1
}
```

---

## 7. `getReceipt`

Read a `DecisionLog` receipt by ID.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "decisionId": { "type": "string" }
  },
  "required": ["decisionId"]
}
```

### Response

```json
{
  "id": "0",
  "agent": "0x...",
  "intentHash": "0x...",
  "verdict": 2,
  "reasonHash": "0x...",
  "outcomeHash": "0x...",
  "timestamp": "1718659200"
}
```

---

## 8. `reputation`

Read Trust Capital score and tier for an agent from chain.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "agent": { "type": "string" }
  },
  "required": ["agent"]
}
```

### Response

```json
{
  "agent": "0x...",
  "score": "100",
  "tier": 1,
  "updatedAt": "1718659200"
}
```

Tier mapping: `0` UNTRUSTED, `1` BRONZE, `2` SILVER, `3` GOLD, `4` PLATINUM.

---

## 9. `rotateKey`

Rotate agent key for the calling owner on `IdentityRegistry`.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "newAgent": { "type": "string" },
    "ownerPrivateKey": { "type": "string" }
  },
  "required": ["newAgent", "ownerPrivateKey"]
}
```

### Response

```json
{
  "txHash": "0x...",
  "newAgent": "0x..."
}
```

---

## Cursor MCP Configuration

Example `.cursor/mcp.json` entry:

```json
{
  "mcpServers": {
    "covenant": {
      "command": "node",
      "args": ["packages/skill/dist/index.js"],
      "env": {
        "MCP_STDIO_ENABLED": "true"
      }
    }
  }
}
```

Ensure `.env` is populated or env vars are inlined. Build first: `pnpm --filter @covenant/skill build`.

## Related Docs

- [API Reference](./API_REFERENCE.md)
- [Architecture](./ARCHITECTURE.md)
- [Security — LLM cannot ALLOW](./SECURITY.md#llm-cannot-allow)
