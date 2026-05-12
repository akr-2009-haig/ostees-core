import { useAccount } from "wagmi";
import { useWalletStore } from "@/store/wallet";

export function useActiveWallet() {
  const wagmiAccount = useAccount();
  const { importedWallets, activeImportedWalletId, selectedChainId } = useWalletStore();

  const activeImported = importedWallets.find((w) => w.id === activeImportedWalletId) ?? null;

  if (wagmiAccount.isConnected && wagmiAccount.address) {
    return {
      address: wagmiAccount.address as string,
      chainId: wagmiAccount.chainId ?? selectedChainId,
      isConnected: true,
      source: "wagmi" as const,
      connector: wagmiAccount.connector?.name ?? "External",
    };
  }

  if (activeImported) {
    return {
      address: activeImported.address,
      chainId: selectedChainId,
      isConnected: true,
      source: "imported" as const,
      connector: activeImported.type,
    };
  }

  return {
    address: null,
    chainId: selectedChainId,
    isConnected: false,
    source: null,
    connector: null,
  };
}
