import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
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
import { api } from "@/lib/api";
import { tierName, truncateAddress } from "@/lib/utils";

export function ReputationPage() {
  const reputationQuery = useQuery({
    queryKey: ["reputation"],
    queryFn: api.getReputationList,
    refetchInterval: 60_000,
  });

  const agents = reputationQuery.data?.agents ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Reputation Explorer</h2>
        <p className="text-muted-foreground">
          Trust Capital scores for registered agents from GET /api/reputation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Trust Capital</CardTitle>
          <CardDescription>
            Combines IdentityRegistry agents with ReputationRegistry scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reputationQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : reputationQuery.error ? (
            <p className="text-sm text-destructive">
              {reputationQuery.error instanceof Error
                ? reputationQuery.error.message
                : "Failed to load reputation data"}
            </p>
          ) : agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registered agents with reputation data.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>TC Score</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.agent}>
                    <TableCell>
                      <code>{truncateAddress(agent.agent, 6)}</code>
                    </TableCell>
                    <TableCell>
                      <code>{truncateAddress(agent.owner, 6)}</code>
                    </TableCell>
                    <TableCell className="font-mono">{agent.score}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {tierName(agent.tier)} ({agent.tier})
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {agent.updatedAt !== "0"
                        ? new Date(Number(agent.updatedAt) * 1000).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">{agent.metadataURI}</TableCell>
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
