import { useState } from "react";
import { useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowUpRight, ArrowDownLeft, Search, ExternalLink,
  RefreshCw, ChevronLeft, ChevronRight, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveWallet } from "@/hooks/useActiveWallet";
import { useWalletStore } from "@/store/wallet";
import { Link } from "wouter";

const NETWORKS = [
  { chainId: 1, name: "Ethereum" },
  { chainId: 56, name: "BSC" },
  { chainId: 137, name: "Polygon" },
  { chainId: 42161, name: "Arbitrum" },
  { chainId: 10, name: "Optimism" },
  { chainId: 43114, name: "Avalanche" },
  { chainId: 8453, name: "Base" },
];

const EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io", 56: "https://bscscan.com",
  137: "https://polygonscan.com", 42161: "https://arbiscan.io",
  10: "https://optimistic.etherscan.io", 43114: "https://snowtrace.io",
  8453: "https://basescan.org",
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HistoryPage() {
  const wallet = useActiveWallet();
  const { selectedChainId, setSelectedChainId } = useWalletStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const txParams = { address: wallet.address ?? "", chainId: selectedChainId, page, limit: 20 };
  const { data: txPage, isLoading, refetch } = useListTransactions(
    txParams,
    { query: { queryKey: getListTransactionsQueryKey(txParams), enabled: !!wallet.address } }
  );

  const filtered = (txPage?.items ?? []).filter(tx =>
    !search ||
    tx.txHash.toLowerCase().includes(search.toLowerCase()) ||
    (tx.fromAddress?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
    (tx.toAddress?.toLowerCase() ?? "").includes(search.toLowerCase())
  );

  if (!wallet.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-sm mx-auto">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">No Wallet Connected</h2>
        <p className="text-muted-foreground text-sm mb-6">Connect a wallet to view transaction history.</p>
        <Link href="/wallet"><Button>Connect Wallet</Button></Link>
      </div>
    );
  }

  const explorerBase = EXPLORER_URLS[selectedChainId] ?? "https://etherscan.io";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground text-sm mt-1">{txPage?.total ?? 0} transactions found</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} className="h-9 w-9">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={String(selectedChainId)} onValueChange={(v) => { setSelectedChainId(parseInt(v)); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {NETWORKS.map(n => <SelectItem key={n.chainId} value={String(n.chainId)}>{n.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by hash or address..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-mono text-sm" />
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-40" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No transactions found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different network or search term</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((tx) => {
                const isOut = tx.fromAddress?.toLowerCase() === wallet.address?.toLowerCase();
                const isSuccess = tx.status === "success";
                return (
                  <div key={tx.txHash} className="flex items-start gap-3 px-4 py-4 hover:bg-muted/20 transition-colors">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      isSuccess ? isOut ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"
                    )}>
                      {isOut ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{isOut ? "Sent" : "Received"}</span>
                        {tx.txType && <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{tx.txType}</Badge>}
                        <Badge variant={isSuccess ? "outline" : "destructive"} className={cn("text-[10px] px-1.5 py-0", isSuccess && "text-green-400 border-green-400/30 bg-green-400/10")}>
                          {tx.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="address text-xs text-muted-foreground truncate max-w-[200px]">{tx.txHash.slice(0, 20)}...</span>
                        <a href={`${explorerBase}/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 flex-shrink-0">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {tx.toAddress && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {isOut ? "To: " : "From: "}
                          <span className="address">{isOut ? tx.toAddress?.slice(0, 14) : tx.fromAddress?.slice(0, 14)}...</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={cn("text-sm font-medium", isOut ? "text-red-400" : "text-green-400")}>
                        {isOut ? "-" : "+"}{tx.tokenAmount ? `${tx.tokenAmount} ${tx.tokenSymbol}` : "ETH"}
                      </div>
                      {tx.valueUsd && <div className="text-xs text-muted-foreground">${tx.valueUsd.toFixed(2)}</div>}
                      <div className="text-xs text-muted-foreground mt-0.5">{timeAgo(tx.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(txPage?.total ?? 0) > 20 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="gap-1">
                <ChevronLeft className="w-3 h-3" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {page}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} className="gap-1">
                Next <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
