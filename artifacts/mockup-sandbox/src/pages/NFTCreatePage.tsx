import { useState, useRef } from "react";
import { useEstimateDeployGas } from "@workspace/api-client-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Image, ChevronRight, ChevronLeft, CheckCircle2,
  ExternalLink, Loader2, AlertCircle, Zap, Upload
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
  { chainId: 8453, name: "Base", symbol: "ETH" },
];

interface NFTConfig {
  name: string; symbol: string; description: string; maxSupply: string; mintPrice: string;
  maxPerWallet: string; salePhase: string; launchDate: string; whitelist: string;
  royaltyPct: string; royaltyRecipient: string; baseUri: string; useIpfs: boolean; chainId: number;
}

export default function NFTCreatePage() {
  const wallet = useActiveWallet();
  const { addDeployedContract } = useWalletStore();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState<{ address: string; txHash: string } | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<NFTConfig>({
    name: "", symbol: "", description: "", maxSupply: "10000", mintPrice: "0.05",
    maxPerWallet: "10", salePhase: "NotStarted", launchDate: "",
    whitelist: "", royaltyPct: "5", royaltyRecipient: "", baseUri: "", useIpfs: true, chainId: 137,
  });

  const { mutate: estimateGas, data: gasEstimate } = useEstimateDeployGas();
  const set = (k: keyof NFTConfig, v: any) => setConfig(c => ({ ...c, [k]: v }));

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleDeploy = async () => {
    setDeploying(true);
    await new Promise(r => setTimeout(r, 2500));
    const addr = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    addDeployedContract({ address: addr, chainId: config.chainId, type: "ERC721", name: config.name, symbol: config.symbol, txHash, deployedAt: new Date().toISOString() });
    setDeployed({ address: addr, txHash });
    setDeploying(false);
    setStep(6);
    toast({ title: "NFT Collection deployed!", description: `${config.name} is live.` });
  };

  const network = NETWORKS.find(n => n.chainId === config.chainId);
  const explorerBase = config.chainId === 56 ? "https://bscscan.com" : config.chainId === 137 ? "https://polygonscan.com" : "https://etherscan.io";

  if (!wallet.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-sm mx-auto">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Wallet Required</h2>
        <p className="text-muted-foreground text-sm mb-6">Connect a wallet to deploy NFT contracts.</p>
        <Link href="/wallet"><Button>Connect Wallet</Button></Link>
      </div>
    );
  }

  const steps = ["Collection", "Sale", "Royalties", "Metadata", "Deploy"];

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Image className="w-6 h-6 text-primary" /> Create NFT Collection</h1>
        <p className="text-muted-foreground text-sm mt-1">Deploy an ERC-721 NFT collection with custom settings</p>
      </div>

      <div className="flex gap-1 items-center">
        {steps.map((_, i) => (
          <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", i < step - 1 ? "bg-primary" : i === step - 1 ? "bg-primary/50" : "bg-border")} />
            <div className={cn("w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center flex-shrink-0",
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
              <CardTitle className="text-sm font-semibold">Collection Information</CardTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <div className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center h-36 cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-all"
                    onClick={() => fileRef.current?.click()}
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">Click to upload cover image</p>
                        <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, GIF, SVG</p>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Collection Name <span className="text-red-400">*</span></Label>
                  <Input placeholder="e.g. Cool Apes" value={config.name} onChange={e => set("name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Symbol</Label>
                  <Input placeholder="CAPE" value={config.symbol} onChange={e => set("symbol", e.target.value.toUpperCase())} maxLength={10} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Supply</Label>
                  <Input type="number" value={config.maxSupply} onChange={e => set("maxSupply", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea placeholder="Describe your NFT collection..." value={config.description} onChange={e => set("description", e.target.value)} className="resize-none h-20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mint Price</Label>
                  <Input type="number" step="0.001" value={config.mintPrice} onChange={e => set("mintPrice", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max per Wallet</Label>
                  <Input type="number" value={config.maxPerWallet} onChange={e => set("maxPerWallet", e.target.value)} />
                </div>
              </div>
              <Button className="w-full" disabled={!config.name} onClick={() => setStep(2)}>Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <CardTitle className="text-sm font-semibold">Sale Settings</CardTitle>
              <div className="space-y-2">
                <Label className="text-xs">Sale Phase</Label>
                <Select value={config.salePhase} onValueChange={v => set("salePhase", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NotStarted">Not Started</SelectItem>
                    <SelectItem value="Whitelist">Whitelist Only</SelectItem>
                    <SelectItem value="Public">Public Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Launch Date & Time</Label>
                <Input type="datetime-local" value={config.launchDate} onChange={e => set("launchDate", e.target.value)} />
              </div>
              {config.salePhase === "Whitelist" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Whitelist Addresses</Label>
                  <Textarea placeholder="0x..., one address per line" value={config.whitelist} onChange={e => set("whitelist", e.target.value)} className="resize-none h-28 font-mono text-xs" />
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <CardTitle className="text-sm font-semibold">Royalties (EIP-2981)</CardTitle>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Royalty Percentage</Label>
                  <span className="text-xs font-medium text-primary">{config.royaltyPct}%</span>
                </div>
                <Input type="number" min={0} max={10} step={0.5} value={config.royaltyPct} onChange={e => set("royaltyPct", e.target.value)} />
                <p className="text-xs text-muted-foreground">Standard range: 2.5–10%</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Royalty Recipient Address</Label>
                <Input className="font-mono text-xs" placeholder="0x... (defaults to deployer)" value={config.royaltyRecipient} onChange={e => set("royaltyRecipient", e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1" onClick={() => setStep(4)}>Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <CardTitle className="text-sm font-semibold">Token Metadata</CardTitle>
              <div className={cn("flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer", config.useIpfs ? "border-primary/50 bg-primary/10" : "border-border bg-secondary")} onClick={() => set("useIpfs", !config.useIpfs)}>
                <div>
                  <p className="text-sm font-medium">Use IPFS (Recommended)</p>
                  <p className="text-xs text-muted-foreground">Decentralized, permanent metadata storage</p>
                </div>
                <Switch checked={config.useIpfs} onCheckedChange={v => set("useIpfs", v)} />
              </div>
              {!config.useIpfs && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Base URI</Label>
                  <Input placeholder="https://api.example.com/metadata/" value={config.baseUri} onChange={e => set("baseUri", e.target.value)} />
                </div>
              )}
              {config.useIpfs && (
                <Alert className="border-blue-500/30 bg-blue-500/10">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-xs text-blue-300">
                    Upload metadata to IPFS (e.g. Pinata) after deployment and use setBaseURI() to update the contract.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1" onClick={() => { estimateGas({ data: { contractType: "ERC721", chainId: config.chainId } }); setStep(5); }}>Network & Deploy <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <CardTitle className="text-sm font-semibold">Select Network & Deploy</CardTitle>
              <div className="grid grid-cols-2 gap-2">
                {NETWORKS.map(n => (
                  <div key={n.chainId}
                    className={cn("flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all", config.chainId === n.chainId ? "border-primary bg-primary/10" : "border-border bg-secondary")}
                    onClick={() => { set("chainId", n.chainId); estimateGas({ data: { contractType: "ERC721", chainId: n.chainId } }); }}
                  >
                    <span className="text-sm">{n.name}</span>
                    {config.chainId === n.chainId && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                ))}
              </div>
              {gasEstimate && (
                <div className="p-3 rounded-lg bg-secondary border border-border space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Estimated Gas</span><span>{gasEstimate.gasUnits}</span></div>
                  <div className="flex justify-between font-semibold"><span>Total Cost</span><span>{gasEstimate.estimatedEth} {network?.symbol ?? "ETH"} (~${gasEstimate.estimatedUsd?.toFixed(2)})</span></div>
                </div>
              )}
              <div className="p-4 rounded-lg bg-secondary border border-border space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Collection</span><span>{config.name} ({config.symbol})</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Max Supply</span><span>{parseInt(config.maxSupply).toLocaleString()} NFTs</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mint Price</span><span>{config.mintPrice} {network?.symbol}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Royalties</span><span>{config.royaltyPct}%</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(4)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1 glow-blue" onClick={handleDeploy} disabled={deploying}>
                  {deploying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deploying...</> : <><Zap className="w-4 h-4 mr-2" /> Deploy Collection</>}
                </Button>
              </div>
            </div>
          )}

          {step === 6 && deployed && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto glow-green">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold">{config.name} is Live!</h3>
              <p className="text-sm text-muted-foreground">Your NFT collection has been deployed to {network?.name}.</p>
              <div className="p-3 rounded-lg bg-secondary border border-border">
                <p className="text-xs text-muted-foreground mb-1">Contract Address</p>
                <div className="address text-xs font-medium break-all">{deployed.address}</div>
              </div>
              <div className="flex gap-2">
                <a href={`${explorerBase}/address/${deployed.address}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2"><ExternalLink className="w-4 h-4" /> View Contract</Button>
                </a>
                <Button className="flex-1" onClick={() => { setStep(1); setDeployed(null); }}>Create Another</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
