import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge, verdictBadgeVariant } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDecisionStream } from "@/hooks/useDecisionStream";
import { api, type DecisionRecord } from "@/lib/api";
import { truncateAddress } from "@/lib/utils";

function mergeDecisions(base: DecisionRecord[], live: DecisionRecord[]): DecisionRecord[] {
  const map = new Map<string, DecisionRecord>();
  for (const item of [...live, ...base]) {
    map.set(item.id, item);
  }
  return [...map.values()].sort((a, b) => Number(BigInt(b.id) - BigInt(a.id)));
}

export function DecisionsPage() {
  const { events, connected } = useDecisionStream();

  const decisionsQuery = useQuery({
    queryKey: ["decisions", 50],
    queryFn: () => api.getDecisions(50),
    refetchInterval: 60_000,
  });

  const liveRecords: DecisionRecord[] = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        agent: event.agent,
        intentHash: event.intentHash,
        verdict: event.verdict,
        verdictCode: 0,
        reasonHash: "0x",
        outcomeHash: "0x",
        timestamp: event.timestamp,
      })),
    [events],
  );

  const decisions = mergeDecisions(decisionsQuery.data?.decisions ?? [], liveRecords);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Decision Feed</h2>
          <p className="text-muted-foreground">
            Historical decisions from GET /api/decisions with live SSE updates.
          </p>
        </div>
        <Badge variant={connected ? "allow" : "secondary"}>
          SSE {connected ? "connected" : "connecting…"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>DecisionLog</CardTitle>
          <CardDescription>
            {decisionsQuery.data?.stats
              ? `${decisionsQuery.data.stats.total} total · ${decisionsQuery.data.stats.allow} allow · ${decisionsQuery.data.stats.warn} warn · ${decisionsQuery.data.stats.deny} deny`
              : "Loading on-chain stats…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {decisionsQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : decisionsQuery.error ? (
            <p className="text-sm text-destructive">
              {decisionsQuery.error instanceof Error
                ? decisionsQuery.error.message
                : "Failed to load decisions"}
            </p>
          ) : decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No decisions logged on-chain yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Intent hash</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.map((decision) => (
                  <TableRow key={decision.id}>
                    <TableCell>{decision.id}</TableCell>
                    <TableCell>
                      <Link to={`/reputation`} className="font-mono text-primary underline-offset-4 hover:underline">
                        {truncateAddress(decision.agent, 6)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={verdictBadgeVariant(decision.verdict)}>{decision.verdict}</Badge>
                    </TableCell>
                    <TableCell>
                      <code>{truncateAddress(decision.intentHash, 6)}</code>
                    </TableCell>
                    <TableCell>
                      {decision.timestamp
                        ? new Date(Number(decision.timestamp) * 1000).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
