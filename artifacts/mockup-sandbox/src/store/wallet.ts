import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ImportedWallet {
  id: string;
  address: string;
  name: string;
  type: "seed" | "privateKey" | "keystore" | "created";
  encryptedKey?: string;
  derivationPath?: string;
  createdAt: string;
}

export interface DeployedContract {
  address: string;
  chainId: number;
  type: string;
  name: string;
  symbol?: string;
  txHash: string;
  deployedAt: string;
  explorerUrl?: string;
}

interface WalletStore {
  importedWallets: ImportedWallet[];
  activeImportedWalletId: string | null;
  selectedChainId: number;
  preferredCurrency: string;
  deployedContracts: DeployedContract[];
  theme: "dark" | "light";

  addImportedWallet: (wallet: ImportedWallet) => void;
  removeImportedWallet: (id: string) => void;
  setActiveImportedWallet: (id: string | null) => void;
  setSelectedChainId: (chainId: number) => void;
  setPreferredCurrency: (currency: string) => void;
  addDeployedContract: (contract: DeployedContract) => void;
  setTheme: (theme: "dark" | "light") => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      importedWallets: [],
      activeImportedWalletId: null,
      selectedChainId: 1,
      preferredCurrency: "USD",
      deployedContracts: [],
      theme: "dark",

      addImportedWallet: (wallet) =>
        set((s) => ({ importedWallets: [...s.importedWallets, wallet] })),

      removeImportedWallet: (id) =>
        set((s) => ({
          importedWallets: s.importedWallets.filter((w) => w.id !== id),
          activeImportedWalletId:
            s.activeImportedWalletId === id ? null : s.activeImportedWalletId,
        })),

      setActiveImportedWallet: (id) =>
        set({ activeImportedWalletId: id }),

      setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),

      setPreferredCurrency: (currency) => set({ preferredCurrency: currency }),

      addDeployedContract: (contract) =>
        set((s) => ({ deployedContracts: [contract, ...s.deployedContracts] })),

      setTheme: (theme) => set({ theme }),
    }),
    { name: "ostees-wallet-store" }
  )
);
