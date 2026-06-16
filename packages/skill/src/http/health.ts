import type { Express, Request, Response } from "express";
import type { Logger } from "pino";
import type { RpcCapabilities } from "../engine/simulator.js";
import type { ChainClients } from "../chain/clients.js";

export interface HealthState {
  rpc: RpcCapabilities;
  attesterBalance: bigint;
  attesterAddress: string;
  onChainAttester: string;
  attesterMatch: boolean;
}

export function registerHealthRoutes(
  app: Express,
  getState: () => Promise<HealthState>,
  log: Logger,
): void {
  app.get("/health", async (_req: Request, res: Response) => {
    try {
      const state = await getState();
      const funded = state.attesterBalance > 0n;
      res.status(funded && state.attesterMatch ? 200 : 503).json({
        status: funded && state.attesterMatch ? "ok" : "degraded",
        rpc: {
          ...state.rpc,
          blockNumber: state.rpc.blockNumber.toString(),
        },
        attester: {
          address: state.attesterAddress,
          onChain: state.onChainAttester,
          match: state.attesterMatch,
          balanceWei: state.attesterBalance.toString(),
        },
      });
    } catch (error) {
      log.error({ err: error }, "health check failed");
      res.status(503).json({ status: "error", message: "health check failed" });
    }
  });

  app.get("/health/live", (_req, res) => {
    res.status(200).json({ status: "live" });
  });
}

export async function collectHealthState(clients: ChainClients): Promise<HealthState> {
  const { probeRpcCapabilities } = await import("../engine/simulator.js");
  const { readAttesterOnChain } = await import("../chain/clients.js");

  const [rpc, attesterBalance, onChainAttester] = await Promise.all([
    probeRpcCapabilities(clients.publicClient),
    clients.publicClient.getBalance({ address: clients.attesterAccount.address }),
    readAttesterOnChain(clients),
  ]);

  return {
    rpc,
    attesterBalance,
    attesterAddress: clients.attesterAccount.address,
    onChainAttester,
    attesterMatch:
      clients.attesterAccount.address.toLowerCase() === onChainAttester.toLowerCase(),
  };
}

export type { ChainClients };
