export const INDEXER_STATE_LAST_BLOCK = "last_processed_block";

export interface DecodedCovenantEvent {
  kind: "CovenantSet";
  owner: string;
  agent: string;
  covenantHash: string;
  tierCurveRef: string;
  ipfsUri: string;
}

export interface DecodedAgentEvent {
  kind: "AgentRegistered";
  owner: string;
  agent: string;
  metadataUri: string;
}

export interface DecodedDecisionEvent {
  kind: "DecisionLogged";
  id: string;
  agent: string;
  intentHash: string;
  verdict: number;
  reasonHash: string;
  outcomeHash: string;
}

export interface DecodedReputationEvent {
  kind: "ReputationUpdated";
  agent: string;
  score: bigint;
  tier: number;
  decisionIds: string[];
  repWriteId: string;
}

export interface DecodedBreachEvent {
  kind: "CovenantBreached";
  agent: string;
  intentHash: string;
}

export type DecodedIndexerEvent =
  | DecodedAgentEvent
  | DecodedCovenantEvent
  | DecodedDecisionEvent
  | DecodedReputationEvent
  | DecodedBreachEvent;

export interface RawLogPayload {
  txHash: string;
  logIndex: number;
  blockNumber: bigint;
  blockTimestamp: Date;
  event: DecodedIndexerEvent;
}

/** JSON-safe job payload for BullMQ (no BigInt). */
export interface StoredLogPayload {
  txHash: string;
  logIndex: number;
  blockNumber: string;
  blockTimestamp: string;
  event: StoredIndexerEvent;
}

export type StoredIndexerEvent =
  | DecodedAgentEvent
  | DecodedCovenantEvent
  | DecodedDecisionEvent
  | DecodedBreachEvent
  | {
      kind: "ReputationUpdated";
      agent: string;
      score: string;
      tier: number;
      decisionIds: string[];
      repWriteId: string;
    };

export function toStoredPayload(payload: RawLogPayload): StoredLogPayload {
  const { event, blockNumber, blockTimestamp, ...rest } = payload;
  const storedEvent: StoredIndexerEvent =
    event.kind === "ReputationUpdated"
      ? { ...event, score: event.score.toString() }
      : event;

  return {
    ...rest,
    blockNumber: blockNumber.toString(),
    blockTimestamp: blockTimestamp.toISOString(),
    event: storedEvent,
  };
}

export function fromStoredPayload(stored: StoredLogPayload): RawLogPayload {
  const { event, blockNumber, blockTimestamp, ...rest } = stored;
  const decodedEvent: DecodedIndexerEvent =
    event.kind === "ReputationUpdated"
      ? { ...event, score: BigInt(event.score) }
      : event;

  return {
    ...rest,
    blockNumber: BigInt(blockNumber),
    blockTimestamp: new Date(blockTimestamp),
    event: decodedEvent,
  };
}

export function jobIdForLog(txHash: string, logIndex: number): string {
  return `${txHash.toLowerCase()}-${logIndex}`;
}

export function parseJobId(jobId: string): { txHash: string; logIndex: number } {
  const sep = jobId.lastIndexOf("-");
  if (sep <= 0) {
    throw new Error(`Invalid job id: ${jobId}`);
  }
  return { txHash: jobId.slice(0, sep), logIndex: Number(jobId.slice(sep + 1)) };
}
