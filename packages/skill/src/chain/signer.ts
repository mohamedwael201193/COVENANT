import {
  buildAllowAttestationTypedData,
  computeIntentHash,
  type AllowAttestation,
  type Intent,
  type SignedAllowAttestation,
} from "@covenant/shared";
import type { ChainClients } from "./clients.js";

export { computeIntentHash };

export async function signAllowAttestation(
  clients: ChainClients,
  attestation: AllowAttestation,
): Promise<SignedAllowAttestation> {
  const typedData = buildAllowAttestationTypedData(
    attestation,
    clients.contracts.guardedExecutor,
    clients.chain.id,
  );

  const signature = await clients.walletClient.signTypedData({
    account: clients.attesterAccount,
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
  });

  const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
  const v = Number(`0x${signature.slice(130, 132)}`);

  return { ...attestation, v, r, s };
}

export function intentFromInput(input: Intent): Intent {
  return {
    agent: input.agent,
    target: input.target,
    data: input.data,
    value: BigInt(input.value),
    nonce: BigInt(input.nonce),
  };
}
