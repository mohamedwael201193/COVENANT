import {
  createPublicClient,
  decodeEventLog,
  fallback,
  http,
  type Address,
  type Hex,
  type Log,
  type PublicClient,
} from "viem";
import type { Logger } from "pino";
import { abis, type ChainConfig } from "covenant-shared";
import { prisma } from "./db/client.js";
import type { EnvConfig } from "./config.js";
import { INDEXER_STATE_LAST_BLOCK, type DecodedIndexerEvent, type RawLogPayload } from "./types.js";
import type { QueueBundle } from "./queue.js";
import { enqueueIngest, enqueueScore } from "./queue.js";
import { isLogProcessed } from "./projectors/index.js";
import { getLogsChunked } from "./logs.js";

const WATCHED_EVENTS = [
  { name: "AgentRegistered" as const, abi: abis.identityRegistry },
  { name: "CovenantSet" as const, abi: abis.covenantRegistry },
  { name: "DecisionLogged" as const, abi: abis.decisionLog },
  { name: "ReputationUpdated" as const, abi: abis.reputationRegistry },
  { name: "CovenantBreached" as const, abi: abis.guardedExecutor },
];

export interface WatcherDeps {
  env: EnvConfig;
  chain: ChainConfig;
  queues: QueueBundle;
  log: Logger;
}

export function createRpcClient(chain: ChainConfig): PublicClient {
  const urls = [
    ...chain.rpcUrls.default.http,
    ...(chain.rpcUrls.fallback?.http ?? []),
  ];
  const transport =
    urls.length > 1 ? fallback(urls.map((url) => http(url))) : http(urls[0]!);

  return createPublicClient({
    chain: {
      id: chain.chainId,
      name: chain.name,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: chain.rpcUrls,
    },
    transport,
  });
}

async function getLastProcessedBlock(): Promise<bigint> {
  const row = await prisma.indexerState.findUnique({ where: { key: INDEXER_STATE_LAST_BLOCK } });
  return row ? BigInt(row.value) : 0n;
}

async function setLastProcessedBlock(block: bigint): Promise<void> {
  await prisma.indexerState.upsert({
    where: { key: INDEXER_STATE_LAST_BLOCK },
    create: { key: INDEXER_STATE_LAST_BLOCK, value: block.toString() },
    update: { value: block.toString() },
  });
}

function contractAddressForEvent(
  eventName: string,
  contracts: ChainConfig["contracts"],
): Address | undefined {
  switch (eventName) {
    case "AgentRegistered":
      return contracts.identityRegistry;
    case "CovenantSet":
      return contracts.covenantRegistry;
    case "DecisionLogged":
      return contracts.decisionLog;
    case "ReputationUpdated":
      return contracts.reputationRegistry;
    case "CovenantBreached":
      return contracts.guardedExecutor;
    default:
      return undefined;
  }
}

function decodeLog(log: Log, blockTimestamp: Date): RawLogPayload | null {
  for (const spec of WATCHED_EVENTS) {
    try {
      const decoded = decodeEventLog({
        abi: spec.abi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== spec.name) continue;

      const event = mapDecodedEvent(
        decoded.eventName,
        decoded.args as unknown as Record<string, unknown>,
        log,
      );
      if (!event) return null;

      return {
        txHash: log.transactionHash ?? "",
        logIndex: Number(log.logIndex ?? 0),
        blockNumber: log.blockNumber ?? 0n,
        blockTimestamp,
        event,
      };
    } catch {
      // not this ABI
    }
  }
  return null;
}

function mapDecodedEvent(
  eventName: string,
  args: Record<string, unknown>,
  log: Log,
): DecodedIndexerEvent | null {
  switch (eventName) {
    case "AgentRegistered":
      return {
        kind: "AgentRegistered",
        owner: String(args.owner),
        agent: String(args.agent),
        metadataUri: String(args.metadataURI ?? args.metadataUri ?? ""),
      };
    case "CovenantSet":
      return {
        kind: "CovenantSet",
        owner: String(args.owner),
        agent: String(args.agent),
        covenantHash: String(args.covenantHash),
        tierCurveRef: String(args.tierCurveRef),
        ipfsUri: String(args.ipfsURI ?? args.ipfsUri ?? ""),
      };
    case "DecisionLogged":
      return {
        kind: "DecisionLogged",
        id: String(args.id),
        agent: String(args.agent),
        intentHash: String(args.intentHash),
        verdict: Number(args.verdict),
        reasonHash: String(args.reasonHash),
        outcomeHash: String(args.outcomeHash),
      };
    case "ReputationUpdated":
      return {
        kind: "ReputationUpdated",
        agent: String(args.agent),
        score: BigInt(String(args.score)),
        tier: Number(args.tier),
        decisionIds: (args.decisionIds as readonly bigint[]).map((id) => id.toString()),
        repWriteId: (log.transactionHash ?? "") as Hex,
      };
    case "CovenantBreached":
      return {
        kind: "CovenantBreached",
        agent: String(args.agent),
        intentHash: String(args.intentHash),
      };
    default:
      return null;
  }
}

export async function pollOnce(deps: WatcherDeps, client: PublicClient): Promise<bigint> {
  const startBlock = deps.env.INDEXER_START_BLOCK;
  let fromBlock = await getLastProcessedBlock();
  if (fromBlock < startBlock) fromBlock = startBlock;

  const head = await client.getBlockNumber();
  if (fromBlock > head) return head;

  const addresses = WATCHED_EVENTS.map((e) =>
    contractAddressForEvent(e.name, deps.chain.contracts),
  ).filter(Boolean) as Address[];

  const logs = await getLogsChunked(client, {
    address: addresses,
    fromBlock,
    toBlock: head,
  });

  const blockTimestamps = new Map<string, Date>();
  for (const log of logs) {
    const blockKey = log.blockNumber?.toString() ?? "0";
    if (!blockTimestamps.has(blockKey)) {
      const block = await client.getBlock({ blockNumber: log.blockNumber! });
      blockTimestamps.set(blockKey, new Date(Number(block.timestamp) * 1000));
    }
  }

  for (const log of logs) {
    const txHash = log.transactionHash ?? "";
    const logIndex = Number(log.logIndex ?? 0);
    if (!txHash) continue;

    if (await isLogProcessed(txHash, logIndex)) continue;

    const payload = decodeLog(log, blockTimestamps.get(log.blockNumber?.toString() ?? "0") ?? new Date());
    if (!payload) continue;

    await enqueueIngest(deps.queues, payload);

    if (payload.event.kind === "DecisionLogged") {
      await enqueueScore(deps.queues, {
        agent: payload.event.agent,
        decisionId: payload.event.id,
        verdict: payload.event.verdict,
        txHash: payload.txHash,
        logIndex: payload.logIndex,
      });
    }

    if (payload.event.kind === "CovenantBreached") {
      await enqueueScore(deps.queues, {
        agent: payload.event.agent,
        breachIntentHash: payload.event.intentHash,
        txHash: payload.txHash,
        logIndex: payload.logIndex,
      });
    }
  }

  await setLastProcessedBlock(head);
  deps.log.info({ fromBlock: fromBlock.toString(), head: head.toString(), logs: logs.length }, "polled blocks");
  return head;
}

export function startWatcher(deps: WatcherDeps): { stop: () => void; client: PublicClient } {
  const client = createRpcClient(deps.chain);
  let timer: ReturnType<typeof setInterval> | undefined;
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await pollOnce(deps, client);
    } catch (err) {
      deps.log.error({ err }, "watcher poll failed");
    } finally {
      running = false;
    }
  };

  void tick();
  timer = setInterval(() => void tick(), deps.env.INDEXER_POLL_INTERVAL_MS);

  return {
    stop: () => {
      if (timer) clearInterval(timer);
    },
    client,
  };
}

export async function fetchAllHistoricalLogs(
  client: PublicClient,
  chain: ChainConfig,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<RawLogPayload[]> {
  const addresses = WATCHED_EVENTS.map((e) =>
    contractAddressForEvent(e.name, chain.contracts),
  ).filter(Boolean) as Address[];

  const logs = await getLogsChunked(client, { address: addresses, fromBlock, toBlock });
  const blockTimestamps = new Map<string, Date>();

  const payloads: RawLogPayload[] = [];
  for (const log of logs) {
    const blockKey = log.blockNumber?.toString() ?? "0";
    if (!blockTimestamps.has(blockKey)) {
      const block = await client.getBlock({ blockNumber: log.blockNumber! });
      blockTimestamps.set(blockKey, new Date(Number(block.timestamp) * 1000));
    }
    const payload = decodeLog(log, blockTimestamps.get(blockKey)!);
    if (payload) payloads.push(payload);
  }

  payloads.sort((a, b) => {
    if (a.blockNumber === b.blockNumber) return a.logIndex - b.logIndex;
    return a.blockNumber < b.blockNumber ? -1 : 1;
  });

  return payloads;
}
