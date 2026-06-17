import { useSearchParams, Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/api";
import { connectWallet, signMessage } from "@/lib/wallet";

type Step = "loading" | "ready" | "signing" | "success" | "error";

export function ConnectPage() {
  const [params] = useSearchParams();
  const addressParam = params.get("address") ?? "";
  const nonceParam = params.get("nonce") ?? "";
  const agentParam = params.get("agent") ?? "";

  const [step, setStep] = useState<Step>("loading");
  const [message, setMessage] = useState("");
  const [wallet, setWallet] = useState(addressParam);
  const [nonce, setNonce] = useState(nonceParam);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");

  const loadChallenge = useCallback(async () => {
    setStep("loading");
    setError("");
    try {
      if (addressParam && nonceParam) {
        const res = await fetch(
          `${API_BASE}/sessions/challenge?address=${encodeURIComponent(addressParam)}&nonce=${encodeURIComponent(nonceParam)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setWallet(addressParam);
          setNonce(nonceParam);
          setMessage(data.message);
          setStep("ready");
          return;
        }
      }
      const eth = await connectWallet().catch(() => null);
      const walletAddress = eth?.address ?? addressParam;
      if (!walletAddress) {
        setError("Connect a wallet or open the link from your agent.");
        setStep("error");
        return;
      }
      const res = await fetch(`${API_BASE}/sessions/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start connect");
      setWallet(walletAddress);
      setNonce(data.nonce);
      setMessage(data.message);
      setStep("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load challenge");
      setStep("error");
    }
  }, [addressParam, nonceParam]);

  useEffect(() => {
    void loadChallenge();
  }, [loadChallenge]);

  async function signIn() {
    setStep("signing");
    setError("");
    try {
      const { client, address } = await connectWallet();
      if (address.toLowerCase() !== wallet.toLowerCase()) {
        throw new Error(`Please connect wallet ${wallet}`);
      }
      const signature = await signMessage(client, message);
      const res = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: wallet,
          agentAddress: agentParam || undefined,
          signature,
          message,
          nonce,
          permissions: ["reputation", "simulate", "preflight", "execute"],
          durationDays: 7,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Session creation failed");
      setSessionId(data.sessionId);
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setStep("error");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Connect wallet to COVENANT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Sign in with Ethereum to authorize your AI agent session. No transaction is sent for sign-in.
          </p>

          {wallet && (
            <div className="rounded-md bg-muted p-3 space-y-1 font-mono text-xs break-all">
              <div>
                <span className="text-muted-foreground">Wallet </span>
                {wallet}
              </div>
              {nonce && (
                <div>
                  <span className="text-muted-foreground">Nonce </span>
                  {nonce}
                </div>
              )}
            </div>
          )}

          {step === "success" && (
            <div className="rounded-md border border-green-500/30 bg-green-500/10 p-4 space-y-2">
              <p className="font-medium text-green-700 dark:text-green-400">Session created</p>
              <p className="font-mono text-xs break-all">sessionId: {sessionId}</p>
              <p className="text-muted-foreground">Return to your agent — it can now use this session for approvals.</p>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/connect/success?sessionId=${sessionId}`}>View session details</Link>
              </Button>
            </div>
          )}

          {error && <p className="text-destructive">{error}</p>}

          {step !== "success" && (
            <Button
              className="w-full"
              onClick={() => void signIn()}
              disabled={step === "loading" || step === "signing" || !message}
            >
              {step === "signing" ? "Confirm in wallet…" : step === "loading" ? "Loading…" : "Sign in with wallet"}
            </Button>
          )}

          {step === "error" && (
            <Button variant="outline" className="w-full" onClick={() => void loadChallenge()}>
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ConnectSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId") ?? "";
  const [session, setSession] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API_BASE}/sessions/${sessionId}`)
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession(null));
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Session active</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-green-600 dark:text-green-400 font-medium">Your wallet is connected to COVENANT.</p>
          <p className="font-mono text-xs break-all">sessionId: {sessionId}</p>
          {session && (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto">{JSON.stringify(session, null, 2)}</pre>
          )}
          <Button asChild className="w-full">
            <Link to="/">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
