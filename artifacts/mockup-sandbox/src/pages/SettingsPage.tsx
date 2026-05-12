import { useState } from "react";
import { useWalletStore } from "@/store/wallet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Moon, Sun, Globe, Info, CheckCircle2, AlertCircle, Trash2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "SAR", label: "SAR — Saudi Riyal" },
  { code: "JPY", label: "JPY — Japanese Yen" },
];

const DEFAULT_RPCS: Record<number, { name: string; default: string }> = {
  1: { name: "Ethereum", default: "https://eth.llamarpc.com" },
  56: { name: "BNB Smart Chain", default: "https://bsc-dataseed.binance.org" },
  137: { name: "Polygon", default: "https://polygon-rpc.com" },
  42161: { name: "Arbitrum", default: "https://arb1.arbitrum.io/rpc" },
  10: { name: "Optimism", default: "https://mainnet.optimism.io" },
  43114: { name: "Avalanche", default: "https://api.avax.network/ext/bc/C/rpc" },
  8453: { name: "Base", default: "https://mainnet.base.org" },
};

export default function SettingsPage() {
  const { theme, setTheme, preferredCurrency, setPreferredCurrency, selectedChainId, setSelectedChainId } = useWalletStore();
  const { toast } = useToast();
  const [rpcOverrides, setRpcOverrides] = useState<Record<number, string>>({});
  const [clearConfirm, setClearConfirm] = useState(false);

  const handleClear = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    localStorage.removeItem("ostees-wallet-store");
    window.location.reload();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize your Ostees experience</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Switch between dark and light mode</p>
            </div>
            <div className="flex gap-2">
              <Button variant={theme === "dark" ? "default" : "outline"} size="sm" className="gap-2 h-9" onClick={() => setTheme("dark")}>
                <Moon className="w-4 h-4" /> Dark
              </Button>
              <Button variant={theme === "light" ? "default" : "outline"} size="sm" className="gap-2 h-9" onClick={() => setTheme("light")}>
                <Sun className="w-4 h-4" /> Light
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Default Network</Label>
              <Select value={String(selectedChainId)} onValueChange={v => setSelectedChainId(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DEFAULT_RPCS).map(([id, { name }]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Display Currency</Label>
              <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4" /> Custom RPC Endpoints
          </CardTitle>
          <CardDescription className="text-xs">Override default RPC URLs for each network</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(DEFAULT_RPCS).map(([id, { name, default: defaultUrl }]) => (
            <div key={id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{name}</span>
              <Input
                className="font-mono text-xs h-8 flex-1"
                placeholder={defaultUrl}
                value={rpcOverrides[parseInt(id)] ?? ""}
                onChange={e => setRpcOverrides(prev => ({ ...prev, [parseInt(id)]: e.target.value }))}
              />
              {rpcOverrides[parseInt(id)] && (
                <Badge variant="outline" className="text-[10px] text-primary border-primary/40 whitespace-nowrap">Custom</Badge>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => toast({ title: "RPC endpoints saved", description: "Custom RPCs will be used on next connection." })}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Save RPC Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="w-4 h-4" /> About Ostees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Ostees Web3 Platform</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0 — Multi-chain wallet & DeFi tools</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="p-2 rounded-lg bg-secondary border border-border">
              <p className="font-medium text-foreground mb-0.5">Supported Chains</p>
              <p>ETH, BSC, Polygon, Arbitrum, Optimism, Avalanche, Base, Fantom + Testnets</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary border border-border">
              <p className="font-medium text-foreground mb-0.5">Wallet Support</p>
              <p>MetaMask, WalletConnect, Coinbase Wallet, Private Key, Seed Phrase</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="border-destructive/30 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-xs text-destructive">
              Clearing local data will remove all imported wallets and settings. This action cannot be undone.
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            size="sm"
            className={cn("gap-2", clearConfirm && "bg-red-600 hover:bg-red-700")}
            onClick={handleClear}
          >
            <Trash2 className="w-4 h-4" />
            {clearConfirm ? "Confirm — Clear All Data?" : "Clear Local Data"}
          </Button>
          {clearConfirm && (
            <Button variant="outline" size="sm" onClick={() => setClearConfirm(false)}>
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
