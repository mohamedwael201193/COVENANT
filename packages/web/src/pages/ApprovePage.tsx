import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API = import.meta.env.VITE_API_URL ?? "https://covenant-skill.onrender.com/api";

export function ApprovePage() {
  const { approvalId } = useParams<{ approvalId: string }>();
  const [approval, setApproval] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<string>("loading");

  useEffect(() => {
    if (!approvalId) return;
    fetch(`${API}/approvals/${approvalId}`)
      .then((r) => r.json())
      .then(setApproval)
      .catch(() => setStatus("error"));
  }, [approvalId]);

  async function approve() {
    if (!approvalId) return;
    setStatus("signing");
    const eth = (window as unknown as { ethereum?: { request: (a: unknown) => Promise<unknown> } }).ethereum;
    if (!eth) {
      setStatus("no-wallet");
      return;
    }
    await eth.request({ method: "eth_requestAccounts" });
    const res = await fetch(`${API}/approvals/${approvalId}/approve`, { method: "POST" });
    if (res.ok) {
      setStatus("approved");
      setApproval(await res.json());
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>COVENANT Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Review the agent request and sign with your wallet. COVENANT never holds your private key.
          </p>
          {approval && (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
              {JSON.stringify(approval, null, 2)}
            </pre>
          )}
          <Button onClick={approve} disabled={status === "approved"}>
            {status === "approved" ? "Approved" : "Connect wallet & approve"}
          </Button>
          {status === "no-wallet" && (
            <p className="text-sm text-destructive">Install MetaMask or a Pharos-compatible wallet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
