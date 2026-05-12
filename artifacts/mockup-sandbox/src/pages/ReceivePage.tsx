import { useState } from "react";
import { useActiveWallet } from "@/hooks/useActiveWallet";
import { useWalletStore } from "@/store/wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, CheckCircle2, Share2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const NETWORKS = [
  { chainId: 1, name: "Ethereum", symbol: "ETH" },
  { chainId: 56, name: "BNB Smart Chain", symbol: "BNB" },
  { chainId: 137, name: "Polygon", symbol: "MATIC" },
  { chainId: 42161, name: "Arbitrum", symbol: "ETH" },
  { chainId: 10, name: "Optimism", symbol: "ETH" },
  { chainId: 43114, name: "Avalanche", symbol: "AVAX" },
  { chainId: 8453, name: "Base", symbol: "ETH" },
];

function QRCode({ value }: { value: string }) {
  const size = 21;
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    const charCode = value.charCodeAt(i % value.length) + i;
    cells.push(charCode % 3 !== 0);
  }
  const getCell = (row: number, col: number) => {
    if (row < 2 || row >= size - 2 || col < 2 || col >= size - 2) return false;
    if ((row < 9 && col < 9) || (row < 9 && col >= size - 9) || (row >= size - 9 && col < 9)) return true;
    return cells[row * size + col];
  };
  const cellSize = 8;
  const svgSize = size * cellSize;
  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={svgSize} height={svgSize} fill="white" />
      {Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => {
          if (!getCell(row, col)) return null;
          return (
            <rect key={`${row}-${col}`} x={col * cellSize} y={row * cellSize} width={cellSize} height={cellSize} fill="black" />
          );
        })
      )}
    </svg>
  );
}

export default function ReceivePage() {
  const wallet = useActiveWallet();
  const { selectedChainId, setSelectedChainId } = useWalletStore();
  const [copied, setCopied] = useState(false);
  const network = NETWORKS.find(n => n.chainId === selectedChainId);

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!wallet.isConnected || !wallet.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-sm mx-auto">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">No Wallet Connected</h2>
        <p className="text-muted-foreground text-sm mb-6">Connect or import a wallet to get your receive address.</p>
        <Link href="/wallet"><Button>Connect Wallet</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Receive Tokens</h1>
        <p className="text-muted-foreground text-sm mt-1">Share your address to receive crypto</p>
      </div>
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Your Receive Address</CardTitle>
            <Select value={String(selectedChainId)} onValueChange={(v) => setSelectedChainId(parseInt(v))}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.map(n => (
                  <SelectItem key={n.chainId} value={String(n.chainId)} className="text-xs">{n.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex justify-center">
            <div className="p-4 rounded-xl bg-white shadow-lg">
              <QRCode value={wallet.address} />
            </div>
          </div>
          <div className="flex justify-center">
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              {network?.name ?? `Chain #${selectedChainId}`} ({network?.symbol ?? "?"})
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">Wallet Address</p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border">
              <span className="address text-xs text-foreground break-all flex-1 text-center">
                {wallet.address}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={copied ? "outline" : "default"}
              className={cn("gap-2 transition-all", copied && "text-green-400 border-green-400/40")}
              onClick={copyAddress}
            >
              {copied ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Address</>}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "My Wallet Address", text: wallet.address ?? "" });
                }
              }}
            >
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-xs text-yellow-300 leading-relaxed">
              Only send <strong>{network?.symbol ?? "tokens"}</strong> and tokens on the <strong>{network?.name ?? "selected"}</strong> network to this address. Sending assets on the wrong network may result in permanent loss.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
