import { createConfig, http } from "wagmi";
import { mainnet, bsc, polygon, arbitrum, optimism, avalanche, base, fantom, sepolia, bscTestnet } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

const projectId = "b56e18d47c72ab683b10814fe9495694";

export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, arbitrum, optimism, avalanche, base, fantom, sepolia, bscTestnet],
  connectors: [
    injected({ target: "metaMask" }),
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: "Ostees" }),
  ],
  transports: {
    [mainnet.id]: http("https://eth.llamarpc.com"),
    [bsc.id]: http("https://bsc-dataseed.binance.org"),
    [polygon.id]: http("https://polygon-rpc.com"),
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
    [optimism.id]: http("https://mainnet.optimism.io"),
    [avalanche.id]: http("https://api.avax.network/ext/bc/C/rpc"),
    [base.id]: http("https://mainnet.base.org"),
    [fantom.id]: http("https://rpc.ftm.tools"),
    [sepolia.id]: http("https://rpc.sepolia.org"),
    [bscTestnet.id]: http("https://data-seed-prebsc-1-s1.binance.org:8545"),
  },
});
