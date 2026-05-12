import { useState } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet, Key, FileText, Plus, Trash2, Copy,
  CheckCircle2, AlertCircle, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletStore, type ImportedWallet } from "@/store/wallet";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";

function truncate(addr: string) {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copy}>
      {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </Button>
  );
}

function ConnectorCard({ connector, isPending, onConnect }: { connector: any; isPending: boolean; onConnect: () => void }) {
  const icons: Record<string, string> = {
    "MetaMask": "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
    "Coinbase Wallet": "https://raw.githubusercontent.com/coinbase/coinbase-wallet-sdk/master/packages/wallet-sdk/assets/images/coinbase-wallet-logo.svg",
    "WalletConnect": "https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Gradient/Logo.svg",
  };
  const icon = icons[connector.name];
  return (
    <button
      onClick={onConnect}
      disabled={isPending}
      className={cn(
        "flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card",
        "hover:border-primary/50 hover:bg-secondary/50 transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      )}
    >
      {icon ? (
        <img src={icon} alt={connector.name} className="w-10 h-10 object-contain" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Wallet className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm font-medium text-foreground">{connector.name}</span>
      {isPending && <span className="text-xs text-muted-foreground">Connecting...</span>}
    </button>
  );
}

export default function WalletPage() {
  const { connect, connectors, isPending, variables } = useConnect();
  const pendingConnectorUid = variables?.connector && "uid" in (variables.connector as object) ? (variables.connector as { uid: string }).uid : null;
  const { disconnect } = useDisconnect();
  const { address, isConnected, connector } = useAccount();
  const { importedWallets, activeImportedWalletId, addImportedWallet, removeImportedWallet, setActiveImportedWallet } = useWalletStore();
  const { toast } = useToast();

  const [privKey, setPrivKey] = useState("");
  const [privKeyWallet, setPrivKeyWallet] = useState<{ address: string } | null>(null);
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [privKeyError, setPrivKeyError] = useState("");

  const [seedWords, setSeedWords] = useState(Array(12).fill(""));
  const [seedError, setSeedError] = useState("");
  const [seedDerivedAddresses, setSeedDerivedAddresses] = useState<string[]>([]);
  const [is24Words, setIs24Words] = useState(false);

  const [newWalletData, setNewWalletData] = useState<{ address: string; mnemonic: string } | null>(null);
  const [mnemonicRevealed, setMnemonicRevealed] = useState(false);

  const handlePrivKeyDetect = () => {
    try {
      const clean = privKey.trim().startsWith("0x") ? privKey.trim() : `0x${privKey.trim()}`;
      if (!/^0x[0-9a-fA-F]{64}$/.test(clean)) {
        setPrivKeyError("Private key must be 64 hex characters.");
        setPrivKeyWallet(null);
        return;
      }
      const wallet = new ethers.Wallet(clean);
      setPrivKeyWallet({ address: wallet.address });
      setPrivKeyError("");
    } catch {
      setPrivKeyError("Invalid private key format.");
      setPrivKeyWallet(null);
    }
  };

  const handleImportPrivKey = () => {
    if (!privKeyWallet) return;
    const id = crypto.randomUUID();
    addImportedWallet({
      id, address: privKeyWallet.address,
      name: `Wallet ${importedWallets.length + 1}`,
      type: "privateKey", createdAt: new Date().toISOString(),
    });
    setActiveImportedWallet(id);
    setPrivKey(""); setPrivKeyWallet(null);
    toast({ title: "Wallet imported", description: `Address: ${truncate(privKeyWallet.address)}` });
  };

  const handleSeedDerive = async () => {
    const phrase = seedWords.slice(0, is24Words ? 24 : 12).join(" ").trim();
    if (phrase.split(" ").length < 12) { setSeedError("Please enter all seed phrase words."); return; }
    try {
      const mnemonicObj = ethers.Mnemonic.fromPhrase(phrase);
      const addresses: string[] = [];
      for (let i = 0; i < 5; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const node = ethers.HDNodeWallet.fromMnemonic(mnemonicObj, path);
        addresses.push(node.address);
      }
      setSeedDerivedAddresses(addresses);
      setSeedError("");
    } catch {
      setSeedError("Invalid seed phrase. Please check the words and try again.");
      setSeedDerivedAddresses([]);
    }
  };

  const handleImportSeedAddress = (address: string, index: number) => {
    const id = crypto.randomUUID();
    addImportedWallet({
      id, address,
      name: `Seed Wallet ${index} (${truncate(address)})`,
      type: "seed", derivationPath: `m/44'/60'/0'/0/${index}`, createdAt: new Date().toISOString(),
    });
    setActiveImportedWallet(id);
    setSeedWords(Array(12).fill(""));
    setSeedDerivedAddresses([]);
    toast({ title: "Wallet imported from seed phrase", description: `Address: ${truncate(address)}` });
  };

  const handleCreateWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    setNewWalletData({ address: wallet.address, mnemonic: wallet.mnemonic?.phrase ?? "" });
    setMnemonicRevealed(false);
  };

  const handleSaveNewWallet = () => {
    if (!newWalletData) return;
    const id = crypto.randomUUID();
    addImportedWallet({
      id, address: newWalletData.address,
      name: `New Wallet ${importedWallets.length + 1}`,
      type: "created", createdAt: new Date().toISOString(),
    });
    setActiveImportedWallet(id);
    setNewWalletData(null);
    toast({ title: "Wallet created", description: `Address: ${truncate(newWalletData.address)}` });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallet Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Connect external wallets or import using your private key or seed phrase</p>
      </div>

      {(isConnected || importedWallets.length > 0) && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Active Wallets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {isConnected && address && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{connector?.name ?? "External"}</span>
                    <Badge variant="outline" className="text-[10px] text-green-400 border-green-400/30">Connected</Badge>
                  </div>
                  <div className="address text-xs text-muted-foreground">{truncate(address)}</div>
                </div>
                <CopyBtn text={address} />
                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-300" onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </div>
            )}
            {importedWallets.map((w: ImportedWallet) => (
              <div key={w.id}
                className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  w.id === activeImportedWalletId ? "bg-primary/10 border-primary/40" : "bg-secondary border-border hover:border-border/80"
                )}
                onClick={() => setActiveImportedWallet(w.id)}
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Key className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{w.name}</span>
                    {w.id === activeImportedWalletId && <Badge variant="outline" className="text-[10px] text-primary border-primary/40">Active</Badge>}
                    <Badge variant="outline" className="text-[10px] capitalize">{w.type}</Badge>
                  </div>
                  <div className="address text-xs text-muted-foreground">{truncate(w.address)}</div>
                </div>
                <CopyBtn text={w.address} />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300"
                  onClick={(e) => { e.stopPropagation(); removeImportedWallet(w.id); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="connect">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connect">Connect</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="connect" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Connect Wallet</CardTitle>
              <CardDescription>Use MetaMask, WalletConnect, or another browser wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {connectors.map((c) => (
                  <ConnectorCard
                    key={c.uid}
                    connector={c}
                    isPending={isPending && pendingConnectorUid === c.uid}
                    onConnect={() => connect({ connector: c })}
                  />
                ))}
              </div>
              <Alert className="mt-4 border-border bg-secondary/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Make sure your browser wallet extension is installed. For WalletConnect, scan the QR code with any compatible app.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-4 space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4" /> Import via Private Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Input
                  type={showPrivKey ? "text" : "password"}
                  placeholder="0x... or 64 hex characters"
                  value={privKey}
                  onChange={(e) => setPrivKey(e.target.value)}
                  className="font-mono pr-10 text-sm"
                />
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPrivKey(!showPrivKey)}>
                  {showPrivKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
              {privKeyError && <p className="text-xs text-red-400">{privKeyError}</p>}
              {privKeyWallet && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-muted-foreground mb-1">Detected address:</p>
                  <div className="address text-sm font-medium text-green-400">{privKeyWallet.address}</div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrivKeyDetect} className="flex-1">Detect Address</Button>
                {privKeyWallet && <Button onClick={handleImportPrivKey} className="flex-1">Import Wallet</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Import via Seed Phrase
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setIs24Words(!is24Words); setSeedWords(Array(is24Words ? 12 : 24).fill("")); }}>
                  {is24Words ? "12 words" : "24 words"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={cn("grid gap-2", is24Words ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4")}>
                {seedWords.slice(0, is24Words ? 24 : 12).map((word, i) => (
                  <div key={i} className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground select-none">{i+1}</span>
                    <Input
                      className="pl-5 text-xs h-8 font-mono"
                      placeholder="word"
                      value={word}
                      onChange={(e) => {
                        const newWords = [...seedWords];
                        newWords[i] = e.target.value.toLowerCase().trim();
                        setSeedWords(newWords);
                      }}
                    />
                  </div>
                ))}
              </div>
              {seedError && <p className="text-xs text-red-400">{seedError}</p>}
              <Button onClick={handleSeedDerive} className="w-full">Derive Addresses</Button>
              {seedDerivedAddresses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Select an address to import:</p>
                  {seedDerivedAddresses.map((addr, i) => (
                    <div key={addr} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-secondary hover:border-primary/40 transition-colors">
                      <div className="flex-1">
                        <div className="text-[10px] text-muted-foreground mb-0.5">m/44'/60'/0'/0/{i}</div>
                        <div className="address text-xs text-foreground">{addr}</div>
                      </div>
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleImportSeedAddress(addr, i)}>Import</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Create New Wallet</CardTitle>
              <CardDescription>Generate a new HD wallet with a secure seed phrase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!newWalletData ? (
                <>
                  <Alert className="border-yellow-500/30 bg-yellow-500/10">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-xs text-yellow-300">
                      Make sure you're in a secure environment. Never share your seed phrase with anyone.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleCreateWallet} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Generate New Wallet
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Wallet address:</p>
                    <div className="flex items-center gap-2">
                      <span className="address text-sm font-medium text-foreground">{newWalletData.address}</span>
                      <CopyBtn text={newWalletData.address} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-yellow-300">Seed Phrase</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMnemonicRevealed(!mnemonicRevealed)}>
                        {mnemonicRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                    {mnemonicRevealed ? (
                      <div className="grid grid-cols-4 gap-1.5">
                        {newWalletData.mnemonic.split(" ").map((word, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">{i+1}.</span>
                            <span className="font-mono text-foreground">{word}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-20 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">Click the eye icon to reveal</p>
                      </div>
                    )}
                    {mnemonicRevealed && <CopyBtn text={newWalletData.mnemonic} />}
                  </div>
                  <Button onClick={handleSaveNewWallet} className="w-full" disabled={!mnemonicRevealed}>
                    {mnemonicRevealed ? "I've saved my seed phrase — Import Wallet" : "Reveal seed phrase first to continue"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
