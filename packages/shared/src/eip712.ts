import {
  encodeAbiParameters,
  hashTypedData,
  keccak256,
  type Address,
  type Hex,
} from "viem";
import { PHAROS_ATLANTIC_CHAIN_ID } from "./chains.js";
import { Verdict, type AllowAttestation, type Intent } from "./types.js";

export const COVENANT_EIP712_DOMAIN = {
  name: "COVENANT",
  version: "1",
} as const;

export const ALLOW_ATTESTATION_TYPES = {
  AllowAttestation: [
    { name: "agent", type: "address" },
    { name: "intentHash", type: "bytes32" },
    { name: "covenantHash", type: "bytes32" },
    { name: "verdict", type: "uint8" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

/**
 * Matches GuardedExecutor.computeIntentHash:
 * keccak256(abi.encode(agent, target, keccak256(data), value, nonce))
 */
export function computeIntentHash(intent: Intent): Hex {
  const dataHash = keccak256(intent.data);
  return keccak256(
    encodeAbiParameters(
      [
        { type: "address" },
        { type: "address" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "uint256" },
      ],
      [intent.agent, intent.target, dataHash, intent.value, intent.nonce],
    ),
  );
}

export function buildAllowAttestationTypedData(
  attestation: AllowAttestation,
  verifyingContract: Address,
  chainId: number = PHAROS_ATLANTIC_CHAIN_ID,
) {
  return {
    domain: {
      ...COVENANT_EIP712_DOMAIN,
      chainId,
      verifyingContract,
    },
    types: ALLOW_ATTESTATION_TYPES,
    primaryType: "AllowAttestation" as const,
    message: {
      agent: attestation.agent,
      intentHash: attestation.intentHash,
      covenantHash: attestation.covenantHash,
      verdict: attestation.verdict,
      deadline: attestation.deadline,
    },
  };
}

export function hashAllowAttestation(
  attestation: AllowAttestation,
  verifyingContract: Address,
  chainId: number = PHAROS_ATLANTIC_CHAIN_ID,
): Hex {
  return hashTypedData(buildAllowAttestationTypedData(attestation, verifyingContract, chainId));
}

export function createAllowAttestationMessage(
  agent: Address,
  intentHash: Hex,
  covenantHash: Hex,
  deadline: bigint,
): AllowAttestation {
  return {
    agent,
    intentHash,
    covenantHash,
    verdict: Verdict.ALLOW,
    deadline,
  };
}

export function canonicalizeCovenantTerms(terms: Record<string, unknown>): string {
  return JSON.stringify(terms, Object.keys(terms).sort());
}

export function hashCovenantTerms(termsJson: string): Hex {
  return keccak256(new TextEncoder().encode(termsJson));
}
