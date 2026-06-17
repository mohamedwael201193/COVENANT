import type { Hex, PublicClient } from "viem";
import type { Intent, SimulationResult } from "covenant-shared";
import type { ChainClients } from "../chain/clients.js";

type DebugTraceClient = PublicClient & {
  request: (args: {
    method: "debug_traceCall";
    params: [Record<string, string>, string, { tracer: string }];
  }) => Promise<unknown>;
};

async function tryDebugTraceCall(
  client: PublicClient,
  params: [Record<string, string>, string, { tracer: string }],
): Promise<boolean> {
  try {
    await (client as DebugTraceClient).request({ method: "debug_traceCall", params });
    return true;
  } catch {
    return false;
  }
}

export interface RpcCapabilities {
  debugTraceCall: boolean;
  ethCall: boolean;
  estimateGas: boolean;
  chainId: number;
  blockNumber: bigint;
}

const PROBE_CALL: Hex = "0x";

function normalizeRpcError(error: unknown): { message: string; rpcUnavailable: boolean } {
  const raw = error instanceof Error ? error.message : String(error);
  const rpcUnavailable =
    /fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|timeout|rate limit|cu limit exceeded/i.test(raw);
  if (rpcUnavailable) {
    return {
      rpcUnavailable: true,
      message:
        "Pharos RPC unavailable or rate-limited. Retry shortly or set PHAROS_RPC_URL to another Atlantic RPC endpoint.",
    };
  }
  return { rpcUnavailable: false, message: raw };
}

export async function probeRpcCapabilities(
  client: PublicClient,
): Promise<RpcCapabilities> {
  const [chainId, blockNumber] = await Promise.all([
    client.getChainId(),
    client.getBlockNumber(),
  ]);

  let debugTraceCall = false;
  debugTraceCall = await tryDebugTraceCall(client, [
    { to: "0x0000000000000000000000000000000000000001", data: PROBE_CALL },
    "latest",
    { tracer: "callTracer" },
  ]);

  let ethCall = false;
  try {
    await client.call({
      to: "0x0000000000000000000000000000000000000001",
      data: PROBE_CALL,
    });
    ethCall = true;
  } catch {
    ethCall = true;
  }

  let estimateGas = false;
  try {
    await client.estimateGas({
      to: "0x0000000000000000000000000000000000000001",
      data: PROBE_CALL,
    });
    estimateGas = true;
  } catch {
    estimateGas = false;
  }

  return { debugTraceCall, ethCall, estimateGas, chainId, blockNumber };
}

export async function simulateIntent(
  clients: ChainClients,
  intent: Intent,
  from?: `0x${string}`,
  options: { estimateGas?: boolean } = {},
): Promise<SimulationResult> {
  const estimateGasEnabled = options.estimateGas ?? false;
  const account = from ?? intent.agent;
  let returnData: Hex | undefined;
  let gasEstimate: bigint | undefined;
  let revertReason: string | undefined;
  let success = false;
  let traceAvailable = false;
  let rpcUnavailable = false;

  const callPromise = clients.publicClient.call({
      account,
      to: intent.target,
      data: intent.data,
      value: intent.value,
  });
  const gasPromise = estimateGasEnabled
    ? clients.publicClient.estimateGas({
        account,
        to: intent.target,
        data: intent.data,
        value: intent.value,
      })
    : Promise.resolve(undefined);

  const [callResult, gasResult] = await Promise.allSettled([callPromise, gasPromise]);

  if (callResult.status === "fulfilled") {
    returnData = callResult.value.data ?? "0x";
    success = true;
  } else {
    success = false;
    const normalized = normalizeRpcError(callResult.reason);
    revertReason = normalized.message;
    rpcUnavailable = normalized.rpcUnavailable;
  }

  if (gasResult.status === "fulfilled") {
    gasEstimate = gasResult.value;
  } else {
    if (!revertReason) {
      const normalized = normalizeRpcError(gasResult.reason);
      revertReason = normalized.message;
      rpcUnavailable = normalized.rpcUnavailable;
    }
  }

  if (!rpcUnavailable && process.env.COVENANT_DEBUG_TRACE_ENABLED === "true") {
    traceAvailable = await tryDebugTraceCall(clients.publicClient, [
      {
        from: account,
        to: intent.target,
        data: intent.data,
        value: `0x${intent.value.toString(16)}`,
      },
      "latest",
      { tracer: "callTracer" },
    ]);
  }

  return {
    success,
    returnData,
    gasEstimate,
    revertReason,
    traceAvailable,
    rpcUnavailable,
  };
}
