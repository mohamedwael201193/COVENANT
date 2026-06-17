import {
  createWalletClient,
  custom,
  type Hex,
  type WalletClient,
} from "viem";
import { PHAROS_CHAIN, PHAROS_CHAIN_ID_HEX } from "./pharos";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function getEthereum(): EthereumProvider | undefined {
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum;
}

export async function ensurePharosChain(provider: EthereumProvider): Promise<void> {
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
          },
        ],
      });
    } else {
      throw err;
    }
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
