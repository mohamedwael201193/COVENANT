import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { truncateAddress } from "@/lib/utils";

function StatCard({
  title,
  value,
  description,
  loading,
}: {
  title: string;
  value: string | number;
  description?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">
          {loading ? <Skeleton className="h-9 w-16" /> : value}
        </CardTitle>
      </CardHeader>
      {description ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function DashboardPage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
    refetchInterval: 30_000,
  });

  const decisionsQuery = useQuery({
    queryKey: ["decisions", "stats"],
    queryFn: () => api.getDecisions(1),
    refetchInterval: 30_000,
  });

  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: api.getAgents,
    refetchInterval: 60_000,
  });

  const covenantsQuery = useQuery({
    queryKey: ["covenants"],
    queryFn: api.getCovenants,
    refetchInterval: 60_000,
  });

  const loading =
    healthQuery.isLoading || decisionsQuery.isLoading || agentsQuery.isLoading || covenantsQuery.isLoading;

  const health = healthQuery.data;
  const stats = decisionsQuery.data?.stats;
  const agents = agentsQuery.data?.agents ?? [];
  const covenants = covenantsQuery.data?.covenants ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Live overview from the COVENANT skill server and on-chain DecisionLog.
        </p>
      </div>

      {(healthQuery.error || decisionsQuery.error) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Backend unavailable</CardTitle>
            <CardDescription>
              Ensure the skill server is running at localhost:8787.{" "}
              {healthQuery.error instanceof Error ? healthQuery.error.message : null}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="System status"
          value={health?.status?.toUpperCase() ?? "—"}
          description={
            health?.rpc
              ? `Chain ${health.rpc.chainId} · block ${health.rpc.blockNumber}`
              : undefined
          }
          loading={loading}
        />
        <StatCard
          title="Total decisions"
          value={stats?.total ?? 0}
          description="DecisionLog entries on-chain"
          loading={loading}
        />
        <StatCard
          title="Registered agents"
          value={agents.length}
          description="Active IdentityRegistry agents"
          loading={loading}
        />
        <StatCard
          title="Active covenants"
          value={covenants.length}
          description="CovenantRegistry records"
          loading={loading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="ALLOW" value={stats?.allow ?? 0} loading={loading} />
        <StatCard title="WARN" value={stats?.warn ?? 0} loading={loading} />
        <StatCard title="DENY" value={stats?.deny ?? 0} loading={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attester health</CardTitle>
          <CardDescription>Oracle signer used for execution certification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : health?.attester ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={health.attester.match ? "allow" : "deny"}>
                  {health.attester.match ? "MATCH" : "MISMATCH"}
                </Badge>
              </div>
              <p>
                <span className="text-muted-foreground">Local: </span>
                <code>{truncateAddress(health.attester.address, 6)}</code>
              </p>
              <p>
                <span className="text-muted-foreground">On-chain: </span>
                <code>{truncateAddress(health.attester.onChain, 6)}</code>
              </p>
              <p>
                <span className="text-muted-foreground">Balance: </span>
                {health.attester.balanceWei} wei
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No attester data returned from /health.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 text-sm">
        <Link to="/decisions" className="text-primary underline-offset-4 hover:underline">
          View decision feed
        </Link>
        <Link to="/covenants" className="text-primary underline-offset-4 hover:underline">
          Create covenant
        </Link>
        <Link to="/reputation" className="text-primary underline-offset-4 hover:underline">
          Explore reputation
        </Link>
      </div>
    </div>
  );
}
