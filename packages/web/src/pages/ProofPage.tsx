import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { explorerTxUrl } from "@/lib/utils";

export function ProofPage() {
  const { txHash } = useParams<{ txHash: string }>();
  const explorerUrl = txHash ? explorerTxUrl(txHash) : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Proof Link</h2>
        <p className="text-muted-foreground">On-chain transaction proof on Pharos Atlantic explorer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction</CardTitle>
          <CardDescription>
            {txHash ? (
              <>
                Hash <code className="break-all">{txHash}</code>
              </>
            ) : (
              "No transaction hash provided."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {explorerUrl ? (
            <>
              <Button asChild>
                <a href={explorerUrl} target="_blank" rel="noreferrer">
                  Open on atlantic.pharosscan.xyz
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/covenants">Back to covenants</Link>
              </Button>
            </>
          ) : (
            <Button variant="outline" asChild>
              <Link to="/">Back to dashboard</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
