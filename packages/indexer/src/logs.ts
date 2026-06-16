import type { Address, Log, PublicClient } from "viem";

/** Pharos RPC providers limit eth_getLogs to ~1000 blocks per request. */
export const MAX_LOG_BLOCK_RANGE = 999n;

export async function getLogsChunked(
  client: PublicClient,
  params: { address: Address[]; fromBlock: bigint; toBlock: bigint },
): Promise<Log[]> {
  const { address, fromBlock, toBlock } = params;
  if (fromBlock > toBlock) return [];

  const all: Log[] = [];
  for (let start = fromBlock; start <= toBlock; start += MAX_LOG_BLOCK_RANGE + 1n) {
    const end =
      start + MAX_LOG_BLOCK_RANGE > toBlock ? toBlock : start + MAX_LOG_BLOCK_RANGE;
    const chunk = await client.getLogs({ address, fromBlock: start, toBlock: end });
    all.push(...chunk);
  }
  return all;
}
