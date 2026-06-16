import { describe, expect, it } from "vitest";
import {
  encodeAbiParameters,
  keccak256,
  type Address,
  type Hex,
} from "viem";
import {
  computeIntentHash,
  createAllowAttestationMessage,
  hashAllowAttestation,
  hashCovenantTerms,
} from "../src/eip712.js";
import { Verdict, type Intent } from "../src/types.js";

const AGENT = "0x1111111111111111111111111111111111111111" as Address;
const TARGET = "0x2222222222222222222222222222222222222222" as Address;
const GUARDED_EXECUTOR = "0xA8452Ec99ce0C64f20701dB7dD3abDb607c00496" as Address;
const DATA = "0xdeadbeef" as Hex;
const CHAIN_ID = 688689;

describe("computeIntentHash", () => {
  it("matches Solidity abi.encode(agent, target, keccak256(data), value, nonce)", () => {
    const intent: Intent = {
      agent: AGENT,
      target: TARGET,
      data: DATA,
      value: 42n,
      nonce: 7n,
    };

    const dataHash = keccak256(intent.data);
    const expected = keccak256(
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

    expect(computeIntentHash(intent)).toBe(expected);
  });

  it("is stable for zero value and empty calldata", () => {
    const intent: Intent = {
      agent: AGENT,
      target: TARGET,
      data: "0x" as Hex,
      value: 0n,
      nonce: 1n,
    };
    const hash = computeIntentHash(intent);
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(computeIntentHash(intent)).toBe(hash);
  });
});

describe("AllowAttestation EIP-712", () => {
  it("produces deterministic typed-data hash", () => {
    const intent: Intent = {
      agent: AGENT,
      target: TARGET,
      data: "0x" as Hex,
      value: 0n,
      nonce: 1n,
    };
    const intentHash = computeIntentHash(intent);
    const covenantHash = hashCovenantTerms('{"version":"1"}');
    const deadline = 9999999999n;

    const attestation = createAllowAttestationMessage(
      AGENT,
      intentHash,
      covenantHash,
      deadline,
    );
    expect(attestation.verdict).toBe(Verdict.ALLOW);

    const digest = hashAllowAttestation(attestation, GUARDED_EXECUTOR, CHAIN_ID);
    expect(digest).toMatch(/^0x[a-f0-9]{64}$/);
    expect(hashAllowAttestation(attestation, GUARDED_EXECUTOR, CHAIN_ID)).toBe(digest);
  });
});

describe("hashCovenantTerms", () => {
  it("hashes canonical JSON bytes", () => {
    const json = '{"agent":"0x00","version":"1"}';
    expect(hashCovenantTerms(json)).toBe(keccak256(new TextEncoder().encode(json)));
  });
});
