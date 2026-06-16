import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { explorerTxUrl, truncateAddress } from "@/lib/utils";

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address");
const privateKeySchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid private key");

const covenantFormSchema = z.object({
  agent: addressSchema,
  owner: addressSchema,
  ownerPrivateKey: privateKeySchema,
  ipfsURI: z.string().min(1).max(2048),
  label: z.string().optional(),
  baseMaxValueWei: z.string().min(1),
  allowlist: z.string().optional(),
  denylist: z.string().optional(),
  minCounterpartyTier: z.coerce.number().int().min(0).max(4),
  requireSimulation: z.boolean(),
  requireGoplus: z.boolean(),
});

type CovenantFormValues = z.infer<typeof covenantFormSchema>;

const DEFAULT_TIER_LIMITS = [
  { tier: 0, maxValueWei: "0" },
  { tier: 1, maxValueWei: "100000000000000000" },
  { tier: 2, maxValueWei: "1000000000000000000" },
  { tier: 3, maxValueWei: "10000000000000000000" },
  { tier: 4, maxValueWei: "100000000000000000000" },
];

function parseAddressList(value?: string): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CovenantsPage() {
  const queryClient = useQueryClient();

  const covenantsQuery = useQuery({
    queryKey: ["covenants"],
    queryFn: api.getCovenants,
  });

  const form = useForm<CovenantFormValues>({
    resolver: zodResolver(covenantFormSchema),
    defaultValues: {
      agent: "",
      owner: "",
      ownerPrivateKey: "",
      ipfsURI: "ipfs://",
      label: "",
      baseMaxValueWei: "1000000000000000000",
      allowlist: "",
      denylist: "",
      minCounterpartyTier: 0,
      requireSimulation: true,
      requireGoplus: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: api.createCovenant,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["covenants"] });
      form.reset();
      window.location.href = `/proof/${result.txHash}`;
    },
  });

  const onSubmit = (values: CovenantFormValues) => {
    const requiredChecks: ("simulation" | "goplus")[] = [];
    if (values.requireSimulation) requiredChecks.push("simulation");
    if (values.requireGoplus) requiredChecks.push("goplus");

    createMutation.mutate({
      agent: values.agent,
      ownerPrivateKey: values.ownerPrivateKey,
      ipfsURI: values.ipfsURI,
      covenant: {
        version: "1",
        agent: values.agent,
        owner: values.owner,
        allowlist: parseAddressList(values.allowlist),
        denylist: parseAddressList(values.denylist),
        baseMaxValueWei: values.baseMaxValueWei,
        tierLimits: DEFAULT_TIER_LIMITS,
        minCounterpartyTier: values.minCounterpartyTier,
        timeWindows: [],
        requiredChecks,
        label: values.label || undefined,
        createdAt: new Date().toISOString(),
      },
    });
  };

  const covenants = covenantsQuery.data?.covenants ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Covenant Builder</h2>
        <p className="text-muted-foreground">
          Create on-chain covenants via the skill server setCovenant flow.
        </p>
      </div>

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">Create</TabsTrigger>
          <TabsTrigger value="list">On-chain ({covenants.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle>New covenant</CardTitle>
              <CardDescription>
                Submits POST /api/covenants. Owner private key is used locally by the skill server to sign the
                transaction — testnet keys only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="agent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent address</FormLabel>
                        <FormControl>
                          <Input placeholder="0x…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="owner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner address</FormLabel>
                        <FormControl>
                          <Input placeholder="0x…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ownerPrivateKey"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Owner private key</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="off" placeholder="0x…" {...field} />
                        </FormControl>
                        <FormDescription>Never use a mainnet key. Testnet deployer/owner only.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ipfsURI"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>IPFS URI</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Agent policy name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="baseMaxValueWei"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base max value (wei)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="allowlist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allowlist</FormLabel>
                        <FormControl>
                          <Input placeholder="0x…, 0x…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="denylist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Denylist</FormLabel>
                        <FormControl>
                          <Input placeholder="0x…, 0x…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minCounterpartyTier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min counterparty tier (0–4)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" {...form.register("requireSimulation")} />
                      Require simulation
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" {...form.register("requireGoplus")} />
                      Require GoPlus
                    </label>
                  </div>

                  {createMutation.error ? (
                    <p className="md:col-span-2 text-sm text-destructive">
                      {createMutation.error instanceof Error
                        ? createMutation.error.message
                        : "Failed to create covenant"}
                    </p>
                  ) : null}

                  <div className="md:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Submitting…" : "Set covenant on-chain"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Registered covenants</CardTitle>
              <CardDescription>Read from GET /api/covenants (CovenantSet events + registry state)</CardDescription>
            </CardHeader>
            <CardContent>
              {covenantsQuery.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : covenants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No covenants found on-chain.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Covenant hash</TableHead>
                      <TableHead>IPFS</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {covenants.map((covenant) => (
                      <TableRow key={`${covenant.owner}-${covenant.agent}`}>
                        <TableCell>
                          <code>{truncateAddress(covenant.agent, 6)}</code>
                        </TableCell>
                        <TableCell>
                          <code>{truncateAddress(covenant.owner, 6)}</code>
                        </TableCell>
                        <TableCell>
                          <code>{truncateAddress(covenant.covenantHash, 6)}</code>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{covenant.ipfsURI}</TableCell>
                        <TableCell>{new Date(Number(covenant.updatedAt) * 1000).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {createMutation.data ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Tx:{" "}
              <Link to={`/proof/${createMutation.data.txHash}`} className="text-primary underline">
                {truncateAddress(createMutation.data.txHash, 8)}
              </Link>
            </p>
            <p>
              Covenant hash: <code>{createMutation.data.covenantHash}</code>
            </p>
            <Badge variant="secondary">{createMutation.data.ipfsURI}</Badge>
            <p>
              <a
                href={explorerTxUrl(createMutation.data.txHash)}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                View on PharosScan
              </a>
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
