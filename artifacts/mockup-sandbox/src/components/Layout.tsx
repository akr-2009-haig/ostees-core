import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Wallet, Send, Download, History,
  Coins, Image, FileCode, Settings, ChevronLeft,
  ChevronRight, Moon, Sun, Menu, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/store/wallet";
import { useActiveWallet } from "@/hooks/useActiveWallet";
import { useDisconnect } from "wagmi";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", labelAr: "الرئيسية" },
  { href: "/wallet", icon: Wallet, label: "Wallets", labelAr: "المحافظ" },
  { href: "/send", icon: Send, label: "Send", labelAr: "إرسال" },
  { href: "/receive", icon: Download, label: "Receive", labelAr: "استقبال" },
  { href: "/history", icon: History, label: "History", labelAr: "المعاملات" },
  { href: "/tokens/create", icon: Coins, label: "Create Token", labelAr: "إنشاء رمز" },
  { href: "/nft/create", icon: Image, label: "Create NFT", labelAr: "إنشاء NFT" },
  { href: "/contracts", icon: FileCode, label: "Contracts", labelAr: "العقود" },
  { href: "/settings", icon: Settings, label: "Settings", labelAr: "الإعدادات" },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { theme, setTheme } = useWalletStore();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:relative z-50 flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn("flex items-center gap-3 p-4 border-b border-sidebar-border", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 glow-blue">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-sidebar-foreground text-sm">Ostees</div>
              <div className="text-xs text-muted-foreground">Web3 Platform</div>
            </div>
          )}
        </div>

        {!collapsed && wallet.isConnected && wallet.address && (
          <div className="mx-3 mt-3 p-3 rounded-lg bg-secondary border border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">
                  {wallet.connector}
                </div>
                <div className="address text-xs text-foreground font-medium">
                  {truncateAddress(wallet.address)}
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-green-400 border-green-400/30 bg-green-400/10">
                Live
              </Badge>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(({ href, icon: Icon, label, labelAr }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs font-medium">{label}</span>
                      <span className="text-[10px] opacity-60">{labelAr}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {!collapsed && <span className="text-xs text-muted-foreground flex-1">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-background/80 backdrop-blur-sm flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>

          <div className="flex-1" />

          {wallet.isConnected && wallet.address ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="address text-xs text-foreground">
                  {truncateAddress(wallet.address)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Link href="/wallet">
              <Button size="sm" className="h-8 text-xs">
                Connect Wallet
              </Button>
            </Link>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
