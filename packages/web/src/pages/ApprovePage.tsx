import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE } from "@/lib/api";
import { connectWallet } from "@/lib/wallet";
import { CONTRACTS, DECISION_LOG_ABI, GUARDED_EXECUTOR_ABI } from "@/lib/pharos";
import {
  createPublicClient,
  decodeEventLog,
  http,
  type Hex,
} from "viem";
import { PHAROS_CHAIN, PHAROS_RPC } from "@/lib/pharos";

interface ApprovalRecord {
  id: string;
  walletAddress: string;
  intentHash: string;
  verdict: string;
  status: string;
  preflightSummary: Record<string, unknown>;
  executionPayload?: {
    intent: {
      agent: string;
      target: string;
      data: string;
      value: string;
      nonce: string;
    };
    covenantHash: string;
    attestation?: { deadline: string; v: number; r: string; s: string };
  };
  txHash?: string;
  decisionId?: string;
}

interface ExecutionPrep {
  execution: {
    intent: ApprovalRecord["executionPayload"] extends infer P ? P extends { intent: infer I } ? I : never : never;
    covenantHash: string;
    attestation: { deadline: string; v: number; r: string; s: string };
  };
}

export function ApprovePage() {
  const { approvalId } = useParams<{ approvalId: string }>();
  const [approval, setApproval] = useState<ApprovalRecord | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [decisionId, setDecisionId] = useState("");
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!approvalId) return;
    fetch(`${API_BASE}/approvals/${approvalId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "not found");
        setApproval(data);
        if (data.status === "executed") {
          setStatus("executed");
          setTxHash(data.txHash ?? "");
          setDecisionId(data.decisionId ?? "");
        } else {
          setStatus("ready");
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load approval");
        setStatus("error");
      });
  }, [approvalId]);

  useEffect(() => {
    if (!decisionId) return;
    fetch(`${API_BASE}/receipt/${decisionId}`)
      .then((r) => r.json())
      .then(setReceipt)
      .catch(() => setReceipt(null));
  }, [decisionId]);

  async function executeWithWallet() {
    if (!approvalId || !approval) return;
    setStatus("executing");
    setError("");
    try {
      const { client, address } = await connectWallet();
      if (address.toLowerCase() !== approval.walletAddress.toLowerCase()) {
        throw new Error(`Connect wallet ${approval.walletAddress}`);
      }

      const prepRes = await fetch(`${API_BASE}/approvals/${approvalId}/execution`);
      const prep = (await prepRes.json()) as ExecutionPrep & { error?: string };
      if (!prepRes.ok) throw new Error(prep.error ?? "Could not prepare execution");

      const { intent, covenantHash, attestation } = prep.execution;
      const intentValue = BigInt(intent.value);
      const hash = await client.writeContract({
        address: CONTRACTS.guardedExecutor,
        abi: GUARDED_EXECUTOR_ABI,
        functionName: "execute",
        chain: PHAROS_CHAIN,
        account: address,
        args: [
          {
            agent: intent.agent as Hex,
            target: intent.target as Hex,
            data: intent.data as Hex,
            value: intentValue,
            nonce: BigInt(intent.nonce),
          },
          covenantHash as Hex,
          BigInt(attestation.deadline),
          attestation.v,
          attestation.r as Hex,
          attestation.s as Hex,
        ],
        ...(intentValue > 0n ? { value: intentValue } : {}),
      } as Parameters<typeof client.writeContract>[0]);

      const publicClient = createPublicClient({ chain: PHAROS_CHAIN, transport: http(PHAROS_RPC) });
      const txReceipt = await publicClient.waitForTransactionReceipt({ hash });

      let parsedDecisionId = "";
      for (const log of txReceipt.logs) {
        if (log.address.toLowerCase() !== CONTRACTS.decisionLog.toLowerCase()) continue;
        try {
          const decoded = decodeEventLog({
            abi: DECISION_LOG_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "DecisionLogged") {
            parsedDecisionId = String(decoded.args.id);
            break;
          }
        } catch {
          /* skip non-matching logs */
        }
      }

      const completeRes = await fetch(`${API_BASE}/approvals/${approvalId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash, decisionId: parsedDecisionId || undefined }),
      });
      const complete = await completeRes.json();
      if (!completeRes.ok) throw new Error(complete.error ?? "Failed to record execution");

      setTxHash(hash);
      setDecisionId(parsedDecisionId);
      setApproval(complete);
      setStatus("executed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execution failed");
      setStatus("ready");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <CardTitle>COVENANT Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Review the agent request and execute on Pharos with your wallet. COVENANT never holds your private key.
          </p>

          {status === "loading" && <p className="text-sm">Loading approval…</p>}

          {approval && status !== "loading" && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <span className="text-muted-foreground">Approval</span>
                <span className="break-all">{approval.id}</span>
                <span className="text-muted-foreground">Verdict</span>
                <span>{approval.verdict}</span>
                <span className="text-muted-foreground">Intent hash</span>
                <span className="break-all">{approval.intentHash}</span>
                <span className="text-muted-foreground">Wallet</span>
                <span className="break-all">{approval.walletAddress}</span>
              </div>
              {approval.executionPayload?.intent && (
                <div className="rounded-md bg-muted p-3 text-xs font-mono space-y-1">
                  <div>Agent: {approval.executionPayload.intent.agent}</div>
                  <div>Target: {approval.executionPayload.intent.target}</div>
                  <div>Value: {approval.executionPayload.intent.value} wei</div>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {status === "ready" && approval && (
            <Button className="w-full" onClick={() => void executeWithWallet()}>
              Connect wallet & execute
            </Button>
          )}

          {status === "executing" && <p className="text-sm">Confirm transaction in your wallet…</p>}

          {status === "executed" && (
            <div className="rounded-md border border-green-500/30 bg-green-500/10 p-4 space-y-2 text-sm">
              <p className="font-medium text-green-700 dark:text-green-400">Execution complete</p>
              {txHash && (
                <p className="font-mono text-xs break-all">
                  txHash: {txHash}
                </p>
              )}
              {decisionId && (
                <p className="font-mono text-xs break-all">
                  receipt / decisionId: {decisionId}
                </p>
              )}
              {receipt && (
                <pre className="text-xs bg-background/50 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(receipt, null, 2)}
                </pre>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link to="/decisions">View decisions</Link>
              </Button>
            </div>
          )}

          {status === "error" && !approval && (
            <p className="text-sm text-muted-foreground">
              This approval was not found. It may have expired or was created on a different server. Ask your agent to
              request a new approval.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
