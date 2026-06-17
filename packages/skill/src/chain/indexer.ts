import { abis, getIndexerStartBlock } from "covenant-shared";
import type { Address, Hex } from "viem";
import { verdictLabel } from "../engine/schema.js";
import type { ChainClients } from "./clients.js";
import { readDecision, readReputation } from "./clients.js";
import { getContractEventsChunked } from "./logs.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface AgentRecord {
  agent: Address;
  owner: Address;
  metadataURI: string;
  active: boolean;
  blockNumber: string;
}

export interface CovenantRecord {
  owner: Address;
  agent: Address;
  covenantHash: Hex;
  tierCurveRef: Hex;
  ipfsURI: string;
  updatedAt: string;
}

export interface DecisionRecord {
  id: string;
  agent: Address;
  intentHash: Hex;
  verdict: string;
  verdictCode: number;
  reasonHash: Hex;
  outcomeHash: Hex;
  timestamp: string;
}

export interface DecisionStats {
  total: number;
  allow: number;
  warn: number;
  deny: number;
}

export async function listAgents(clients: ChainClients): Promise<AgentRecord[]> {
  const fromBlock = getIndexerStartBlock();
  const logs = await getContractEventsChunked(clients.publicClient, {
    address: clients.contracts.identityRegistry,
    abi: abis.identityRegistry,
    eventName: "AgentRegistered",
    fromBlock,
    toBlock: "latest",
  });

  const seen = new Map<string, AgentRecord>();

  for (const log of logs) {
    const { agent } = (log as unknown as { args: { owner: Address; agent: Address; metadataURI: string }; blockNumber: bigint }).args;
    const blockNumber = (log as unknown as { blockNumber: bigint }).blockNumber;
    const key = agent.toLowerCase();
    if (seen.has(key)) continue;

    await sleep(150);
    const [active, owner, metadataURI] = await Promise.all([
      clients.publicClient.readContract({
        address: clients.contracts.identityRegistry,
        abi: abis.identityRegistry,
        functionName: "isActive",
        args: [agent],
      }),
      clients.publicClient.readContract({
        address: clients.contracts.identityRegistry,
        abi: abis.identityRegistry,
        functionName: "ownerOfAgent",
        args: [agent],
      }),
      clients.publicClient.readContract({
        address: clients.contracts.identityRegistry,
        abi: abis.identityRegistry,
        functionName: "metadataURI",
        args: [agent],
      }),
    ]);

    seen.set(key, {
      agent,
      owner: owner as Address,
      metadataURI: metadataURI as string,
      active: active as boolean,
      blockNumber: blockNumber.toString(),
    });
  }

  return [...seen.values()].filter((a) => a.active);
}

export async function listCovenants(clients: ChainClients): Promise<CovenantRecord[]> {
  const fromBlock = getIndexerStartBlock();
  const logs = await getContractEventsChunked(clients.publicClient, {
    address: clients.contracts.covenantRegistry,
    abi: abis.covenantRegistry,
    eventName: "CovenantSet",
    fromBlock,
    toBlock: "latest",
  });

  const latest = new Map<string, { owner: Address; agent: Address; blockNumber: bigint }>();

  for (const log of logs) {
    const typed = log as unknown as { args: { owner: Address; agent: Address }; blockNumber: bigint };
    const { owner, agent } = typed.args;
    const blockNumber = typed.blockNumber;
    const key = `${owner.toLowerCase()}:${agent.toLowerCase()}`;
    const existing = latest.get(key);
    if (!existing || blockNumber >= existing.blockNumber) {
      latest.set(key, { owner, agent, blockNumber });
    }
  }

  const records: CovenantRecord[] = [];

  for (const { owner, agent } of latest.values()) {
    await sleep(80);
    const result = (await clients.publicClient.readContract({
      address: clients.contracts.covenantRegistry,
      abi: abis.covenantRegistry,
      functionName: "covenants",
      args: [owner, agent],
    })) as readonly [Hex, Hex, string, bigint];

    const [covenantHash, tierCurveRef, ipfsURI, updatedAt] = result;
    if (covenantHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      continue;
    }

    records.push({
      owner,
      agent,
      covenantHash,
      tierCurveRef,
      ipfsURI,
      updatedAt: updatedAt.toString(),
    });
  }

  return records.sort((a, b) => Number(BigInt(b.updatedAt) - BigInt(a.updatedAt)));
}

export async function listDecisions(
  clients: ChainClients,
  limit: number,
): Promise<{ decisions: DecisionRecord[]; stats: DecisionStats }> {
  const nextId = (await clients.publicClient.readContract({
    address: clients.contracts.decisionLog,
    abi: abis.decisionLog,
    functionName: "nextId",
  })) as bigint;

  const safeLimit = Math.max(1, Math.min(limit, 200));
  const startId = nextId === 0n ? 0n : nextId - BigInt(Math.min(safeLimit, Number(nextId)));

  const decisions: DecisionRecord[] = [];

  for (let id = nextId - 1n; id >= startId && id >= 0n; id -= 1n) {
    await sleep(80);
    const row = await readDecision(clients, id);
    const verdictCode = row.verdict;
    const verdict = verdictLabel(verdictCode as 0 | 1 | 2);

    decisions.push({
      id: id.toString(),
      agent: row.agent,
      intentHash: row.intentHash,
      verdict,
      verdictCode,
      reasonHash: row.reasonHash,
      outcomeHash: row.outcomeHash,
      timestamp: row.timestamp.toString(),
    });
  }

  const allStats = await countAllVerdicts(clients, nextId);
  return { decisions, stats: allStats };
}

async function countAllVerdicts(clients: ChainClients, nextId: bigint): Promise<DecisionStats> {
  const stats: DecisionStats = { total: Number(nextId), allow: 0, warn: 0, deny: 0 };
  if (nextId === 0n) return stats;

  const maxScan = 100;
  const scanCount = Math.min(Number(nextId), maxScan);

  for (let i = 0; i < scanCount; i++) {
    const id = nextId - 1n - BigInt(i);
    if (id < 0n) break;
    await sleep(80);
    const row = await readDecision(clients, id);
    const verdict = verdictLabel(row.verdict as 0 | 1 | 2);
    if (verdict === "ALLOW") stats.allow += 1;
    else if (verdict === "WARN") stats.warn += 1;
    else stats.deny += 1;
  }

  return stats;
}

export async function listAgentsWithReputation(clients: ChainClients) {
  const agents = await listAgents(clients);
  return Promise.all(
    agents.map(async (agent) => {
      const rep = await readReputation(clients, agent.agent);
      return {
        ...agent,
        score: rep.score.toString(),
        tier: rep.tier,
        updatedAt: rep.updatedAt.toString(),
      };
    }),
  );
}
