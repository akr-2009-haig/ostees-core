import { useState } from "react";
import { useListTokens, useGetTokenPrices } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send, ChevronRight, ChevronLeft, Zap, Clock, Turtle,
  CheckCircle2, ExternalLink, AlertCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveWallet } from "@/hooks/useActiveWallet";
import { useWalletStore } from "@/store/wallet";
import { useToast } from "@/hooks/use-toast";

const NETWORKS = [
  { chainId: 1, name: "Ethereum", symbol: "ETH" },
  { chainId: 56, name: "BNB Smart Chain", symbol: "BNB" },
  { chainId: 137, name: "Polygon", symbol: "MATIC" },
  { chainId: 42161, name: "Arbitrum", symbol: "ETH" },
  { chainId: 10, name: "Optimism", symbol: "ETH" },
  { chainId: 43114, name: "Avalanche", symbol: "AVAX" },
  { chainId: 8453, name: "Base", symbol: "ETH" },
];

const GAS_OPTIONS = [
  { label: "Slow", icon: Turtle, gwei: "10", usd: "0.12", time: "~5 min" },
  { label: "Normal", icon: Clock, gwei: "20", usd: "0.24", time: "~1 min" },
  { label: "Fast", icon: Zap, gwei: "35", usd: "0.42", time: "~15 sec" },
];

export default function SendPage() {
  const wallet = useActiveWallet();
  const { selectedChainId, setSelectedChainId } = useWalletStore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [gasOption, setGasOption] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [recipientError, setRecipientError] = useState("");

  const { data: tokens, isLoading: tokensLoading } = useListTokens({ chainId: selectedChainId });
  const symbols = tokens?.map((t) => t.symbol).join(",") ?? "ETH";
  const { data: prices } = useGetTokenPrices({ symbols });

  const tokenPrice = selectedToken ? (prices?.[selectedToken.symbol] ?? 0) : 0;
  const amountUsd = parseFloat(amount || "0") * tokenPrice;
  const gasFeeUsd = parseFloat(GAS_OPTIONS[gasOption].usd);

  const validateAddress = (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr);

  const handleStep2 = () => {
    if (!validateAddress(recipient)) {
      setRecipientError("Invalid EVM address. Must be 0x followed by 40 hex characters.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    setRecipientError("");
    setStep(3);
  };

  const handleSend = async () => {
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 2000));
    setTxHash("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""));
    setIsSending(false);
    setStep(4);
  };

  const network = NETWORKS.find(n => n.chainId === selectedChainId);
  const explorerBase = selectedChainId === 56 ? "https://bscscan.com" : selectedChainId === 137 ? "https://polygonscan.com" : "https://etherscan.io";

  if (!wallet.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
        <p className="text-muted-foreground text-sm">Connect a wallet first to send tokens.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Send Tokens</h1>
        <p className="text-muted-foreground text-sm mt-1">Transfer tokens to any address</p>
      </div>

      <div className="flex items-center gap-2">
        {["Select Asset", "Enter Details", "Confirm", "Done"].map((_, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn("flex-1 h-1 rounded-full transition-colors", i < step - 1 ? "bg-primary" : i === step - 1 ? "bg-primary/60" : "bg-border")} />
          </div>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-6 space-y-5">

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Network</Label>
                <Select value={String(selectedChainId)} onValueChange={(v) => { setSelectedChainId(parseInt(v)); setSelectedToken(null); }}>
                  <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                  <SelectContent>
                    {NETWORKS.map(n => <SelectItem key={n.chainId} value={String(n.chainId)}>{n.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Select Token</Label>
                {tokensLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {(tokens ?? []).map((token) => {
                      const price = prices?.[token.symbol] ?? 0;
                      const isSelected = selectedToken?.symbol === token.symbol;
                      return (
                        <div key={token.symbol + token.contractAddress}
                          className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                            isSelected ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-border/60"
                          )}
                          onClick={() => setSelectedToken(token)}
                        >
                          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center overflow-hidden">
                            {token.logoUrl ? <img src={token.logoUrl} alt={token.symbol} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} /> : <span className="text-xs font-bold">{token.symbol[0]}</span>}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{token.symbol}</div>
                            <div className="text-xs text-muted-foreground">{token.name}</div>
                          </div>
                          {price > 0 && <div className="text-xs text-muted-foreground">${price.toFixed(2)}</div>}
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <Button className="w-full" disabled={!selectedToken} onClick={() => setStep(2)}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border">
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  {selectedToken?.logoUrl && <img src={selectedToken.logoUrl} alt={selectedToken.symbol} className="w-full h-full object-contain" />}
                </div>
                <span className="text-sm font-medium">{selectedToken?.name}</span>
                <Badge variant="outline" className="ml-auto text-xs">{network?.name}</Badge>
              </div>
              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input placeholder="0x..." value={recipient} onChange={(e) => { setRecipient(e.target.value); setRecipientError(""); }} className="font-mono text-sm" />
                {recipientError && <p className="text-xs text-red-400">{recipientError}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Amount</Label>
                  <span className="text-xs text-muted-foreground">Balance: 0.1234 {selectedToken?.symbol}</span>
                </div>
                <div className="relative">
                  <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pr-20" />
                  <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs px-2 text-primary" onClick={() => setAmount("0.1234")}>MAX</Button>
                </div>
                {amountUsd > 0 && <p className="text-xs text-muted-foreground">≈ ${amountUsd.toFixed(2)} USD</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1" onClick={handleStep2}>Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Gas Speed</Label>
                <div className="grid grid-cols-3 gap-2">
                  {GAS_OPTIONS.map((opt, i) => {
                    const Icon = opt.icon;
                    return (
                      <button key={i}
                        className={cn("flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-center",
                          gasOption === i ? "border-primary bg-primary/10" : "border-border bg-secondary"
                        )}
                        onClick={() => setGasOption(i)}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">{opt.gwei} Gwei</span>
                        <span className="text-[10px] text-muted-foreground">${opt.usd}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2 p-4 rounded-lg bg-secondary border border-border">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">To</span><span className="address text-xs">{recipient.slice(0,10)}...{recipient.slice(-8)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Token</span><span>{selectedToken?.symbol}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span>{amount} {selectedToken?.symbol}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">≈ USD</span><span>${amountUsd.toFixed(2)}</span></div>
                <div className="border-t border-border pt-2 flex justify-between text-sm"><span className="text-muted-foreground">Gas Fee (~)</span><span>${gasFeeUsd.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-semibold"><span>Total Cost</span><span>${(amountUsd + gasFeeUsd).toFixed(2)}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1 glow-blue" onClick={handleSend} disabled={isSending}>
                  {isSending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Confirm & Send</>}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto glow-green">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Transaction Sent!</h3>
              <p className="text-sm text-muted-foreground">Your transaction is being processed on the blockchain.</p>
              <div className="p-3 rounded-lg bg-secondary border border-border">
                <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                <div className="address text-xs text-foreground break-all">{txHash}</div>
              </div>
              <div className="flex gap-2">
                <a href={`${explorerBase}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2"><ExternalLink className="w-4 h-4" /> View on Explorer</Button>
                </a>
                <Button className="flex-1" onClick={() => { setStep(1); setSelectedToken(null); setAmount(""); setRecipient(""); setTxHash(""); }}>
                  Send Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
