import { useState } from "react";
import { Link } from "wouter";
import { useActiveWallet } from "@/hooks/useActiveWallet";
import {
  useListTokens, getListTokensQueryKey,
  useGetTokenPrices, getGetTokenPricesQueryKey,
  useListTransactions, getListTransactionsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Send, Download, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Wallet, ExternalLink,
  RefreshCw, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/store/wallet";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const wallet = useActiveWallet();
  const { selectedChainId } = useWalletStore();
  const [, setRefreshKey] = useState(0);

  const tokensParams = { chainId: selectedChainId };
  const { data: tokens, isLoading: tokensLoading } = useListTokens(
    tokensParams,
    { query: { queryKey: getListTokensQueryKey(tokensParams), enabled: !!wallet.address } }
  );

  const symbols = tokens?.map((t) => t.symbol).join(",") ?? "ETH,BNB,MATIC";
  const priceParams = { symbols };
  const { data: prices } = useGetTokenPrices(
    priceParams,
    { query: { queryKey: getGetTokenPricesQueryKey(priceParams), enabled: !!symbols, refetchInterval: 30000 } }
  );

  const txParams = { address: wallet.address ?? "", chainId: selectedChainId, limit: 5 };
  const { data: txPage, isLoading: txLoading } = useListTransactions(
    txParams,
    { query: { queryKey: getListTransactionsQueryKey(txParams), enabled: !!wallet.address } }
  );

  if (!wallet.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-6">
          <Wallet className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Connect or import a wallet to view your portfolio, send tokens, and deploy smart contracts.
        </p>
        <Link href="/wallet">
          <Button size="lg" className="glow-blue">
            Connect Wallet
          </Button>
        </Link>
      </div>
    );
  }

  const totalUsd = tokens?.reduce((sum, t) => {
    const price = prices?.[t.symbol] ?? t.priceUsd ?? 0;
    return sum + (0.1234 * price);
  }, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border-border bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
                <div className="text-4xl font-bold text-foreground">{formatUsd(totalUsd)}</div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-sm text-green-400">+2.34%</span>
                  <span className="text-xs text-muted-foreground ml-1">24h</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setRefreshKey(k => k + 1)} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-3 mt-6">
              <Link href="/send">
                <Button className="gap-2"><Send className="w-4 h-4" /> Send</Button>
              </Link>
              <Link href="/receive">
                <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Receive</Button>
              </Link>
              <Button variant="outline" className="gap-2 opacity-50 cursor-not-allowed" disabled>Swap</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Assets</span>
              <span className="text-sm font-medium">{tokens?.length ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Transactions</span>
              <span className="text-sm font-medium">{txPage?.total ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Network</span>
              <Badge variant="outline" className="text-xs">Chain #{selectedChainId}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Source</span>
              <Badge variant="outline" className="text-xs capitalize">{wallet.source}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Token Balances</CardTitle>
            <Link href="/wallet">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">Manage <ChevronRight className="w-3 h-3" /></Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tokensLoading ? (
            <div className="space-y-3 p-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-16" /></div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(tokens ?? []).slice(0, 8).map((token) => {
                const price = prices?.[token.symbol] ?? token.priceUsd ?? 0;
                const balance = 0.1234;
                const valueUsd = balance * price;
                const change = token.priceChange24h ?? 0;
                const isPositive = change >= 0;
                return (
                  <div key={token.symbol + token.contractAddress} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0">
                      {token.logoUrl ? (
                        <img src={token.logoUrl} alt={token.symbol} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">{token.symbol[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-foreground">{token.symbol}</span>
                        {token.isVerified && <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center"><span className="text-[8px] text-white font-bold">✓</span></div>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{token.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">{formatUsd(valueUsd)}</div>
                      <div className={cn("text-xs flex items-center justify-end gap-0.5", isPositive ? "text-green-400" : "text-red-400")}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(change).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
              {(tokens ?? []).length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">No tokens found for this network</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">View all <ChevronRight className="w-3 h-3" /></Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {txLoading ? (
            <div className="space-y-3 p-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : (txPage?.items ?? []).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No transactions found</div>
          ) : (
            <div className="divide-y divide-border">
              {(txPage?.items ?? []).map((tx) => {
                const isOut = tx.fromAddress?.toLowerCase() === wallet.address?.toLowerCase();
                const isSuccess = tx.status === "success";
                return (
                  <div key={tx.txHash} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      isOut ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                    )}>
                      {isOut ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{isOut ? "Sent" : "Received"}</span>
                        <Badge variant={isSuccess ? "outline" : "destructive"} className="text-[10px] px-1.5 py-0">{tx.status}</Badge>
                      </div>
                      <div className="address text-xs text-muted-foreground truncate">{tx.txHash.slice(0, 16)}...</div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">{timeAgo(tx.timestamp)}</span>
                      <a href={`https://etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
