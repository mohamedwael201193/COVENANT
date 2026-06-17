import {
  createWalletClient,
  custom,
  type Hex,
  type WalletClient,
} from "viem";
import { PHAROS_CHAIN, PHAROS_CHAIN_ID, PHAROS_CHAIN_ID_HEX } from "./pharos";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function getEthereum(): EthereumProvider | undefined {
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum;
}

export async function getWalletChainId(): Promise<number | null> {
  const provider = getEthereum();
  if (!provider) return null;
  const hex = (await provider.request({ method: "eth_chainId" })) as string;
  return Number.parseInt(hex, 16);
}

const STALE_PHAROS_CHAIN_ID = 688545;

export function formatChainMismatchMessage(current: number): string {
  if (current === STALE_PHAROS_CHAIN_ID) {
    return (
      "MetaMask is on an outdated Pharos network (chain 688545). " +
      "Remove that network in MetaMask, then add Pharos Atlantic with chain ID 688689 " +
      "(RPC: https://atlantic.dplabs-internal.com)."
    );
  }
  return `Switch MetaMask to Pharos Atlantic (chain ID ${PHAROS_CHAIN_ID}). Currently on chain ${current}.`;
}

export async function ensurePharosChain(provider: EthereumProvider): Promise<void> {
  const readChainId = async (): Promise<number> => {
    const hex = (await provider.request({ method: "eth_chainId" })) as string;
    return Number.parseInt(hex, 16);
  };

  if ((await readChainId()) === PHAROS_CHAIN_ID) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: PHAROS_CHAIN_ID_HEX }],
    });
  } catch (err: unknown) {
    const code = typeof err === "object" && err && "code" in err ? (err as { code: number }).code : 0;
    if (code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: PHAROS_CHAIN_ID_HEX,
            chainName: PHAROS_CHAIN.name,
            nativeCurrency: PHAROS_CHAIN.nativeCurrency,
            rpcUrls: PHAROS_CHAIN.rpcUrls.default.http,
            blockExplorerUrls: ["https://atlantic.pharosscan.xyz"],
          },
        ],
      });
    } else {
      throw err;
    }
  }

  const chainId = await readChainId();
  if (chainId !== PHAROS_CHAIN_ID) {
    throw new Error(formatChainMismatchMessage(chainId));
  }
}

export async function connectWallet(): Promise<{ address: Hex; client: WalletClient }> {
  const provider = getEthereum();
  if (!provider) throw new Error("No wallet detected. Install MetaMask.");
  await ensurePharosChain(provider);
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0] as Hex;
  const client = createWalletClient({
    chain: PHAROS_CHAIN,
    transport: custom(provider),
    account: address,
  });
  return { address, client };
}

export async function signMessage(client: WalletClient, message: string): Promise<Hex> {
  return client.signMessage({ account: client.account!, message });
}

export async function writeContract(
  client: WalletClient,
  args: Parameters<WalletClient["writeContract"]>[0],
): Promise<Hex> {
  return client.writeContract(args);
}
