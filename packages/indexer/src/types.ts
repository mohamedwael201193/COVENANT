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

export function jobIdForLog(txHash: string, logIndex: number): string {
  return `${txHash.toLowerCase()}:${logIndex}`;
}

export function parseJobId(jobId: string): { txHash: string; logIndex: number } {
  const [txHash, logIndexRaw] = jobId.split(":");
  return { txHash, logIndex: Number(logIndexRaw) };
}
