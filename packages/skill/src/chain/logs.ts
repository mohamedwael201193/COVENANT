import type { PublicClient } from "viem";

const MAX_BLOCK_RANGE = 999n;
const CHUNK_DELAY_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type GetEventsParams = Parameters<PublicClient["getContractEvents"]>[0];

/**
 * Fetches contract events in chunks to satisfy RPC providers that limit eth_getLogs range (e.g. 1000 blocks).
 */
export async function getContractEventsChunked(
  client: PublicClient,
  params: GetEventsParams,
): Promise<Awaited<ReturnType<PublicClient["getContractEvents"]>>> {
  const { blockHash: _omit, fromBlock: rawFrom, toBlock: rawTo, ...rest } = params;

  const fromBlock =
    rawFrom === undefined || rawFrom === "latest"
      ? 0n
      : typeof rawFrom === "bigint"
        ? rawFrom
        : BigInt(rawFrom);

  const toBlock =
    rawTo === undefined || rawTo === "latest"
      ? await client.getBlockNumber()
      : typeof rawTo === "bigint"
        ? rawTo
        : BigInt(rawTo);

  if (fromBlock > toBlock) {
    return [];
  }

  const all: Awaited<ReturnType<PublicClient["getContractEvents"]>> = [];

  let first = true;
  for (let start = fromBlock; start <= toBlock; start += MAX_BLOCK_RANGE + 1n) {
    if (!first) await sleep(CHUNK_DELAY_MS);
    first = false;
    const end = start + MAX_BLOCK_RANGE > toBlock ? toBlock : start + MAX_BLOCK_RANGE;
    const chunk = await client.getContractEvents({
      ...rest,
      fromBlock: start,
      toBlock: end,
    });
    all.push(...chunk);
  }

  return all;
}
