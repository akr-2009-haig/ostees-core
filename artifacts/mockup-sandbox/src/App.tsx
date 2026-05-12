import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { wagmiConfig } from "@/lib/wagmi";
import { useWalletStore } from "@/store/wallet";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import WalletPage from "@/pages/WalletPage";
import SendPage from "@/pages/SendPage";
import ReceivePage from "@/pages/ReceivePage";
import HistoryPage from "@/pages/HistoryPage";
import TokenCreatePage from "@/pages/TokenCreatePage";
import NFTCreatePage from "@/pages/NFTCreatePage";
import ContractsPage from "@/pages/ContractsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
    },
  },
});

function ThemeApplier() {
  const { theme } = useWalletStore();
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  return null;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/send" component={SendPage} />
        <Route path="/receive" component={ReceivePage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/tokens/create" component={TokenCreatePage} />
        <Route path="/nft/create" component={NFTCreatePage} />
        <Route path="/contracts" component={ContractsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeApplier />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
