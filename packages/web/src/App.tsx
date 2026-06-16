import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { CovenantsPage } from "@/pages/CovenantsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DecisionsPage } from "@/pages/DecisionsPage";
import { ProofPage } from "@/pages/ProofPage";
import { ReputationPage } from "@/pages/ReputationPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="covenants" element={<CovenantsPage />} />
            <Route path="decisions" element={<DecisionsPage />} />
            <Route path="reputation" element={<ReputationPage />} />
            <Route path="proof/:txHash" element={<ProofPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
