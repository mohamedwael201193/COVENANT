import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConnectPage() {
  const [params] = useSearchParams();
  const address = params.get("address") ?? "";
  const nonce = params.get("nonce") ?? "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Connect wallet to COVENANT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Sign in with Ethereum to authorize your AI agent session.</p>
          <p>
            <strong>Wallet:</strong> {address}
          </p>
          <p>
            <strong>Nonce:</strong> {nonce}
          </p>
          <p className="text-muted-foreground">
            Return to your agent after signing the SIWE message in your wallet extension.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
