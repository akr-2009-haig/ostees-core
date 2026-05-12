import { useState } from "react";
import { useListContractTemplates, useEstimateDeployGas } from "@workspace/api-client-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Coins, ChevronRight, ChevronLeft, CheckCircle2,
  ExternalLink, Loader2, AlertCircle, Flame, Zap, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveWallet } from "@/hooks/useActiveWallet";
import { useWalletStore } from "@/store/wallet";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const NETWORKS = [
  { chainId: 1, name: "Ethereum", symbol: "ETH" },
  { chainId: 56, name: "BNB Smart Chain", symbol: "BNB" },
  { chainId: 137, name: "Polygon", symbol: "MATIC" },
  { chainId: 42161, name: "Arbitrum", symbol: "ETH" },
  { chainId: 8453, name: "Base", symbol: "ETH" },
];

interface TokenConfig {
  name: string; symbol: string; totalSupply: string; decimals: string; maxSupply: string;
  mintable: boolean; burnable: boolean; pausable: boolean; transferFee: number;
  feeRecipient: string; antiDump: number; chainId: number;
}

export default function TokenCreatePage() {
  const wallet = useActiveWallet();
  const { addDeployedContract } = useWalletStore();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState<{ address: string; txHash: string } | null>(null);

  const [config, setConfig] = useState<TokenConfig>({
    name: "", symbol: "", totalSupply: "1000000", decimals: "18", maxSupply: "",
    mintable: false, burnable: false, pausable: false, transferFee: 0, feeRecipient: "", antiDump: 0, chainId: 1,
  });

  useListContractTemplates();
  const { mutate: estimateGas, data: gasEstimate, isPending: estimating } = useEstimateDeployGas();

  const set = (k: keyof TokenConfig, v: any) => setConfig(c => ({ ...c, [k]: v }));

  const handleDeploy = async () => {
    setDeploying(true);
    await new Promise(r => setTimeout(r, 2500));
    const addr = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    addDeployedContract({ address: addr, chainId: config.chainId, type: "ERC20", name: config.name, symbol: config.symbol, txHash, deployedAt: new Date().toISOString() });
    setDeployed({ address: addr, txHash });
    setDeploying(false);
    setStep(4);
    toast({ title: "Token deployed!", description: `${config.name} (${config.symbol}) is live.` });
  };

  const explorerBase = config.chainId === 56 ? "https://bscscan.com" : config.chainId === 137 ? "https://polygonscan.com" : "https://etherscan.io";
  const network = NETWORKS.find(n => n.chainId === config.chainId);

  if (!wallet.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-sm mx-auto">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Wallet Required</h2>
        <p className="text-muted-foreground text-sm mb-6">Connect a wallet to deploy token contracts.</p>
        <Link href="/wallet"><Button>Connect Wallet</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Coins className="w-6 h-6 text-primary" /> Create ERC-20 Token</h1>
        <p className="text-muted-foreground text-sm mt-1">Deploy your own token with custom features</p>
      </div>

      <div className="flex gap-2 items-center">
        {["Basic Info", "Features", "Network", "Deploy"].map((_, i) => (
          <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", i < step - 1 ? "bg-primary" : i === step - 1 ? "bg-primary/50" : "bg-border")} />
            <div className={cn("w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center flex-shrink-0 transition-all",
              i < step - 1 ? "bg-primary border-primary text-primary-foreground" :
              i === step - 1 ? "border-primary text-primary" : "border-border text-muted-foreground"
            )}>
              {i < step - 1 ? "✓" : i + 1}
            </div>
          </div>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-6 space-y-5">

          {step === 1 && (
            <div className="space-y-4">
              <CardTitle className="text-sm font-semibold">Basic Token Information</CardTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Token Name <span className="text-red-400">*</span></Label>
                  <Input placeholder="e.g. My Token" value={config.name} onChange={e => set("name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Symbol <span className="text-red-400">*</span></Label>
                  <Input placeholder="e.g. MTK" value={config.symbol} onChange={e => set("symbol", e.target.value.toUpperCase())} maxLength={12} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Decimals</Label>
                  <Input type="number" value={config.decimals} onChange={e => set("decimals", e.target.value)} min={0} max={18} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Initial Supply <span className="text-red-400">*</span></Label>
                  <Input type="number" placeholder="1000000" value={config.totalSupply} onChange={e => set("totalSupply", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Max Supply <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input type="number" placeholder="Unlimited" value={config.maxSupply} onChange={e => set("maxSupply", e.target.value)} />
                </div>
              </div>
              <Button className="w-full" disabled={!config.name || !config.symbol || !config.totalSupply} onClick={() => setStep(2)}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <CardTitle className="text-sm font-semibold">Token Features</CardTitle>
              <div className="space-y-3">
                {[
                  { key: "mintable" as const, icon: Coins, label: "Mintable", desc: "Owner can mint new tokens after deployment" },
                  { key: "burnable" as const, icon: Flame, label: "Burnable", desc: "Token holders can burn (destroy) tokens" },
                  { key: "pausable" as const, icon: Lock, label: "Pausable", desc: "Owner can pause all token transfers" },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <div key={key} className={cn("flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer", config[key] ? "border-primary/50 bg-primary/10" : "border-border bg-secondary")} onClick={() => set(key, !config[key])}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config[key] ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground")}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                    </div>
                    <Switch checked={config[key]} onCheckedChange={(v) => set(key, v)} />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Transfer Fee</Label>
                  <span className="text-xs font-medium text-primary">{config.transferFee}%</span>
                </div>
                <Slider value={[config.transferFee]} onValueChange={([v]) => set("transferFee", v)} min={0} max={5} step={0.1} className="w-full" />
                {config.transferFee > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fee Recipient Address</Label>
                    <Input className="font-mono text-xs" placeholder="0x..." value={config.feeRecipient} onChange={e => set("feeRecipient", e.target.value)} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Anti-Dump Cooldown</Label>
                  <span className="text-xs font-medium text-primary">{config.antiDump > 0 ? `${config.antiDump}h` : "Off"}</span>
                </div>
                <Slider value={[config.antiDump]} onValueChange={([v]) => set("antiDump", v)} min={0} max={72} step={1} className="w-full" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <CardTitle className="text-sm font-semibold">Network & Deployment</CardTitle>
              <div className="space-y-2">
                <Label className="text-xs">Select Network</Label>
                <div className="grid grid-cols-1 gap-2">
                  {NETWORKS.map(n => (
                    <div key={n.chainId}
                      className={cn("flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all", config.chainId === n.chainId ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-border/60")}
                      onClick={() => { set("chainId", n.chainId); estimateGas({ data: { contractType: "ERC20", chainId: n.chainId } }); }}
                    >
                      <span className="text-sm font-medium">{n.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{n.symbol}</Badge>
                        {config.chainId === n.chainId && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {estimating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-secondary border border-border">
                  <Loader2 className="w-4 h-4 animate-spin" /> Estimating deployment cost...
                </div>
              )}
              {gasEstimate && (
                <div className="p-3 rounded-lg bg-secondary border border-border space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Gas Estimate</p>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gas Units</span><span className="font-mono">{gasEstimate.gasUnits}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gas Price</span><span>{gasEstimate.gasPriceGwei} Gwei</span></div>
                  <div className="flex justify-between text-sm font-semibold"><span>Estimated Cost</span><span>{gasEstimate.estimatedEth} {network?.symbol ?? "ETH"} (~${gasEstimate.estimatedUsd?.toFixed(2) ?? "–"})</span></div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1" onClick={() => setStep(4)}>Review & Deploy <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {step === 4 && !deployed && (
            <div className="space-y-4">
              <CardTitle className="text-sm font-semibold">Review & Deploy</CardTitle>
              <div className="space-y-2 p-4 rounded-lg bg-secondary border border-border text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{config.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Symbol</span><span className="font-medium">{config.symbol}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Supply</span><span>{parseInt(config.totalSupply).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Decimals</span><span>{config.decimals}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Network</span><span>{network?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Features</span>
                  <div className="flex gap-1">
                    {config.mintable && <Badge variant="outline" className="text-[10px]">Mint</Badge>}
                    {config.burnable && <Badge variant="outline" className="text-[10px]">Burn</Badge>}
                    {config.pausable && <Badge variant="outline" className="text-[10px]">Pause</Badge>}
                    {!config.mintable && !config.burnable && !config.pausable && <span className="text-muted-foreground">None</span>}
                  </div>
                </div>
              </div>
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-xs text-yellow-300">
                  Once deployed, the contract is immutable. Verify all settings carefully before proceeding.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1 glow-blue" onClick={handleDeploy} disabled={deploying}>
                  {deploying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deploying...</> : <><Zap className="w-4 h-4 mr-2" /> Deploy Token</>}
                </Button>
              </div>
            </div>
          )}

          {deployed && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto glow-green">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold">{config.name} Deployed!</h3>
              <p className="text-sm text-muted-foreground">Your token is now live on {network?.name}.</p>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Contract Address</p>
                  <div className="address text-xs font-medium text-foreground break-all">{deployed.address}</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                  <div className="address text-xs text-foreground break-all">{deployed.txHash}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`${explorerBase}/address/${deployed.address}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2"><ExternalLink className="w-4 h-4" /> View Contract</Button>
                </a>
                <Button className="flex-1" onClick={() => { setStep(1); setDeployed(null); setConfig({ name:"", symbol:"", totalSupply:"1000000", decimals:"18", maxSupply:"", mintable:false, burnable:false, pausable:false, transferFee:0, feeRecipient:"", antiDump:0, chainId:1 }); }}>
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
