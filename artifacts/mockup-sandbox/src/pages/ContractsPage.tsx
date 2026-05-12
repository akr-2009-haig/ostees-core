import { useListContractTemplates } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Coins, Image, FileCode, ArrowRight, ExternalLink, CheckCircle2 } from "lucide-react";
import { useWalletStore } from "@/store/wallet";

const ICON_MAP: Record<string, React.ElementType> = {
  ERC20: Coins,
  ERC721: Image,
  default: FileCode,
};

const EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io",
  56: "https://bscscan.com",
  137: "https://polygonscan.com",
  42161: "https://arbiscan.io",
  10: "https://optimistic.etherscan.io",
  43114: "https://snowtrace.io",
  8453: "https://basescan.org",
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum", 56: "BSC", 137: "Polygon", 42161: "Arbitrum",
  10: "Optimism", 43114: "Avalanche", 8453: "Base",
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ContractsPage() {
  const { data: templates, isLoading } = useListContractTemplates();
  const { deployedContracts } = useWalletStore();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Smart Contract Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">Deploy battle-tested contracts with a few clicks</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(templates ?? []).map((t) => {
              const Icon = ICON_MAP[t.type] ?? ICON_MAP.default;
              const route = t.type === "ERC20" ? "/tokens/create" : t.type === "ERC721" ? "/nft/create" : "/tokens/create";
              return (
                <Card key={t.id} className="border-border bg-card hover:border-primary/40 transition-all duration-200 group">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-foreground">{t.name}</h3>
                      <Badge variant="outline" className="text-[10px] px-1.5">{t.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex-1 mb-3 leading-relaxed">{t.description}</p>
                    {t.features && t.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {t.features.map((f: string) => (
                          <div key={f} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      {t.estimatedGasUsd && (
                        <span className="text-xs text-muted-foreground">~${t.estimatedGasUsd} deploy cost</span>
                      )}
                      <Link href={route} className="ml-auto">
                        <Button size="sm" className="h-8 text-xs gap-1">
                          Deploy <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {deployedContracts.length > 0 && (
        <div className="space-y-4">
          <Separator className="bg-border" />
          <div>
            <h2 className="text-lg font-semibold">Your Deployed Contracts</h2>
            <p className="text-muted-foreground text-sm">Contracts deployed during this session</p>
          </div>
          <div className="space-y-3">
            {deployedContracts.map((c, i) => {
              const Icon = ICON_MAP[c.type] ?? ICON_MAP.default;
              const explorerBase = EXPLORER_URLS[c.chainId] ?? "https://etherscan.io";
              return (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{c.name}</span>
                        {c.symbol && <span className="text-xs text-muted-foreground">({c.symbol})</span>}
                        <Badge variant="outline" className="text-[10px] px-1.5">{c.type}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5">{CHAIN_NAMES[c.chainId] ?? `Chain #${c.chainId}`}</Badge>
                      </div>
                      <div className="address text-xs text-muted-foreground mt-0.5 truncate">{c.address}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:block">{timeAgo(c.deployedAt)}</span>
                      <a href={`${explorerBase}/address/${c.address}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
