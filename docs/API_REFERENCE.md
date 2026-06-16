# COVENANT API Reference

REST endpoints for the skill server (`:8787`) and indexer (`:8788`).

Base URLs:

- **Skill:** `http://localhost:8787` (production: your Render skill URL)
- **Indexer:** `http://localhost:8788` (production: your Render indexer URL)

All JSON responses use `Content-Type: application/json`. Errors return `{ "error": string | object }`.

---

## Skill Server (`:8787`)

### Health

#### `GET /health`

Returns RPC capability probe and attester status.

**Response 200 (ok):**
```json
{
  "status": "ok",
  "rpc": {
    "chainId": 688689,
    "blockNumber": "24350000",
    "ethCall": true,
    "estimateGas": true,
    "debugTraceCall": false
  },
  "attester": {
    "address": "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3",
    "onChain": "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3",
    "match": true,
    "balanceWei": "1000000000000000000"
  }
}
```

**Response 503 (degraded):** attester unfunded or address mismatch.

#### `GET /health/live`

Liveness probe — always 200.

```json
{ "status": "live" }
```

---

### Agents

#### `GET /api/agents`

List active agents from on-chain events (direct RPC reads).

**Response 200:**
```json
{
  "agents": [
    {
      "agent": "0x...",
      "owner": "0x...",
      "metadataURI": "ipfs://...",
      "active": true,
      "blockNumber": "24340750"
    }
  ]
}
```

---

### Covenants

#### `GET /api/covenants`

List latest covenants per owner/agent pair from chain.

**Response 200:**
```json
{
  "covenants": [
    {
      "owner": "0x...",
      "agent": "0x...",
      "covenantHash": "0x...",
      "tierCurveRef": "0x...",
      "ipfsURI": "ipfs://...",
      "updatedAt": "1718659200"
    }
  ]
}
```

#### `POST /api/covenants`

Set covenant on-chain (requires owner private key in body).

**Request body:**
```json
{
  "agent": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "ownerPrivateKey": "0x...",
  "ipfsURI": "ipfs://...",
  "covenant": {
    "version": "1",
    "agent": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "owner": "0x...",
    "allowlist": ["0x..."],
    "denylist": [],
    "baseMaxValueWei": "10000000000000000",
    "tierLimits": [{ "tier": 1, "maxValueWei": "10000000000000000" }],
    "minCounterpartyTier": 0,
    "timeWindows": [],
    "requiredChecks": ["simulation", "goplus"],
    "createdAt": "2026-06-17T00:00:00.000Z"
  }
}
```

**Response 201:**
```json
{
  "txHash": "0x...",
  "covenantHash": "0x...",
  "tierCurveRef": "0x...",
  "ipfsURI": "ipfs://..."
}
```

**Response 400:** Zod validation error flatten object.

---

### Decisions

#### `GET /api/decisions?limit=50`

List recent decisions from `DecisionLog` on-chain.

| Query | Type | Default | Max |
|---|---|---|---|
| `limit` | number | 50 | 200 |

**Response 200:**
```json
{
  "decisions": [
    {
      "id": "0",
      "agent": "0x...",
      "intentHash": "0x...",
      "verdict": "ALLOW",
      "verdictCode": 2,
      "reasonHash": "0x...",
      "outcomeHash": "0x...",
      "timestamp": "1718659200"
    }
  ],
  "stats": {
    "total": 5,
    "allow": 3,
    "warn": 1,
    "deny": 1
  }
}
```

Verdict codes: `0` = DENY, `1` = WARN, `2` = ALLOW.

---

### Reputation

#### `GET /api/reputation`

List all active agents with on-chain reputation.

**Response 200:**
```json
{
  "agents": [
    {
      "agent": "0x...",
      "owner": "0x...",
      "metadataURI": "ipfs://...",
      "active": true,
      "blockNumber": "24340750",
      "score": "100",
      "tier": 1,
      "updatedAt": "1718659200"
    }
  ]
}
```

#### `GET /api/reputation/:agent`

Single agent reputation from chain.

**Response 200:**
```json
{
  "agent": "0x...",
  "score": "100",
  "tier": 1,
  "updatedAt": "1718659200"
}
```

---

### Preflight & Simulation

#### `POST /api/preflight`

Run full deterministic preflight pipeline.

**Request body:**
```json
{
  "intent": {
    "agent": "0x...",
    "target": "0x...",
    "data": "0x",
    "value": "0",
    "nonce": "0"
  },
  "covenant": { "...": "see covenant schema above" },
  "covenantHash": "0x...",
  "counterpartyTier": 1,
  "deadlineSeconds": 3600
}
```

**Response 200:**
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
    "details": { "addressStatus": "unknown", "tokenStatus": "unknown" }
  },
  "explanation": "Intent complies with covenant policy.",
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

`attestation` is present **only** when `verdict` is `"ALLOW"`.

#### `POST /api/simulate`

Simulate intent via `eth_call` + `eth_estimateGas`.

**Request body:**
```json
{
  "intent": {
    "agent": "0x...",
    "target": "0x...",
    "data": "0x",
    "value": "0",
    "nonce": "0"
  },
  "from": "0x..."
}
```

**Response 200:**
```json
{
  "success": true,
  "returnData": "0x",
  "gasEstimate": "21000",
  "traceAvailable": false
}
```

On revert: `"success": false`, `"revertReason": "..."`.

---

### Receipts

#### `GET /api/receipt/:id`

Read decision receipt from `DecisionLog` by ID.

**Response 200:**
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

### Server-Sent Events

#### `GET /api/events/decisions`

SSE stream of decision events (from in-process watcher).

**Event:** `decision`

**Data:**
```json
{
  "id": "0",
  "agent": "0x...",
  "verdict": "ALLOW",
  "intentHash": "0x...",
  "timestamp": "1718659200"
}
```

Heartbeat comment every 30 seconds.

---

## Indexer (`:8788`)

Read-optimized API backed by Postgres projections. Use when you need pagination, filters, or cached reputation.

### Health

#### `GET /health`

**Response 200:**
```json
{
  "status": "ok",
  "db": true,
  "redis": true,
  "lastIndexedBlock": "24350000",
  "chainHead": "24350010",
  "lag": "10"
}
```

**Response 503:** database or Redis unreachable.

---

### Agents

#### `GET /api/agents?limit=50&offset=0`

| Query | Type | Default | Max |
|---|---|---|---|
| `limit` | number | 50 | 200 |
| `offset` | number | 0 | — |

**Response 200:**
```json
{
  "agents": [
    {
      "address": "0x...",
      "owner": "0x...",
      "metadataUri": "ipfs://...",
      "registeredAt": "2026-06-17T00:00:00.000Z",
      "lastActive": "2026-06-17T00:00:00.000Z",
      "revoked": false
    }
  ]
}
```

#### `GET /api/agents/:address`

**Response 200:** `{ "agent": { ... } }`

**Response 404:** `{ "error": "agent not found" }`

---

### Covenants

#### `GET /api/covenants?agent=0x...&limit=50`

| Query | Type | Description |
|---|---|---|
| `agent` | string | Filter by agent address |
| `limit` | number | Max 200 |

**Response 200:**
```json
{
  "covenants": [
    {
      "id": "clx...",
      "agent": "0x...",
      "owner": "0x...",
      "covenantHash": "0x...",
      "tierCurveRef": "0x...",
      "ipfsUri": "ipfs://...",
      "createdAt": "2026-06-17T00:00:00.000Z",
      "txHash": "0x...",
      "logIndex": 0
    }
  ]
}
```

---

### Decisions

#### `GET /api/decisions?agent=0x...&limit=50`

**Response 200:**
```json
{
  "decisions": [
    {
      "id": "0",
      "agent": "0x...",
      "intentHash": "0x...",
      "verdict": 2,
      "reasonHash": "0x...",
      "outcomeHash": "0x...",
      "blockNumber": "24350000",
      "txHash": "0x...",
      "logIndex": 1,
      "ts": "2026-06-17T00:00:00.000Z"
    }
  ]
}
```

---

### Reputation

#### `GET /api/reputation/:agent`

**Response 200 (cache hit):**
```json
{
  "source": "cache",
  "reputation": { "agent": "0x...", "score": "100", "tier": 1 }
}
```

**Response 200 (db):**
```json
{
  "source": "db",
  "reputation": {
    "agent": "0x...",
    "score": "100",
    "tier": 1,
    "updatedAt": "2026-06-17T00:00:00.000Z",
    "sources": []
  }
}
```

**Response 200 (empty):**
```json
{
  "source": "db",
  "reputation": { "agent": "0x...", "score": "0", "tier": 0 }
}
```

---

### Obligations

#### `GET /api/obligations?agent=0x...`

**Response 200:**
```json
{
  "obligations": [
    {
      "id": "clx...",
      "agent": "0x...",
      "counterparty": "0x...",
      "amount": "10000000000000000",
      "status": "open",
      "settledTx": null,
      "ts": "2026-06-17T00:00:00.000Z"
    }
  ]
}
```

---

## Dashboard Client

The React dashboard (`packages/web`) uses skill endpoints only:

| Client method | Endpoint |
|---|---|
| `api.getHealth()` | `GET {VITE_HEALTH_URL}/health` |
| `api.getAgents()` | `GET {VITE_API_URL}/agents` |
| `api.getCovenants()` | `GET {VITE_API_URL}/covenants` |
| `api.getDecisions()` | `GET {VITE_API_URL}/decisions` |
| `api.getReputationList()` | `GET {VITE_API_URL}/reputation` |
| `api.createCovenant()` | `POST {VITE_API_URL}/covenants` |
| `createDecisionEventSource()` | `GET {VITE_API_URL}/events/decisions` (SSE) |

## Related Docs

- [MCP Reference](./MCP_REFERENCE.md)
- [Architecture](./ARCHITECTURE.md)
