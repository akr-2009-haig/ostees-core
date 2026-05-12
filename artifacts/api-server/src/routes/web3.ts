import { Router } from "express";

const router = Router();

const TOKENS_BY_CHAIN: Record<number, any[]> = {
  1: [
    { symbol: "ETH", name: "Ethereum", decimals: 18, isNative: true, isVerified: true, chainId: 1, priceUsd: 3200, priceChange24h: 2.5, logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    { symbol: "USDT", name: "Tether USD", decimals: 6, isNative: false, isVerified: true, chainId: 1, contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", priceUsd: 1.00, priceChange24h: 0.01, logoUrl: "https://cryptologos.cc/logos/tether-usdt-logo.png" },
    { symbol: "USDC", name: "USD Coin", decimals: 6, isNative: false, isVerified: true, chainId: 1, contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", priceUsd: 1.00, priceChange24h: -0.01, logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", decimals: 8, isNative: false, isVerified: true, chainId: 1, contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", priceUsd: 62000, priceChange24h: 1.8, logoUrl: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png" },
    { symbol: "LINK", name: "Chainlink", decimals: 18, isNative: false, isVerified: true, chainId: 1, contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA", priceUsd: 14.5, priceChange24h: -3.2, logoUrl: "https://cryptologos.cc/logos/chainlink-link-logo.png" },
  ],
  56: [
    { symbol: "BNB", name: "BNB", decimals: 18, isNative: true, isVerified: true, chainId: 56, priceUsd: 580, priceChange24h: 1.2, logoUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png" },
    { symbol: "BUSD", name: "Binance USD", decimals: 18, isNative: false, isVerified: true, chainId: 56, contractAddress: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", priceUsd: 1.00, priceChange24h: 0.0 },
    { symbol: "CAKE", name: "PancakeSwap", decimals: 18, isNative: false, isVerified: true, chainId: 56, contractAddress: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", priceUsd: 2.8, priceChange24h: -1.4 },
  ],
  137: [
    { symbol: "MATIC", name: "Polygon", decimals: 18, isNative: true, isVerified: true, chainId: 137, priceUsd: 0.85, priceChange24h: 3.1, logoUrl: "https://cryptologos.cc/logos/polygon-matic-logo.png" },
    { symbol: "USDC", name: "USD Coin", decimals: 6, isNative: false, isVerified: true, chainId: 137, contractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", priceUsd: 1.00, priceChange24h: 0.0 },
  ],
};

const PRICES: Record<string, number> = {
  ETH: 3200, BTC: 62000, BNB: 580, MATIC: 0.85, USDT: 1.00, USDC: 1.00,
  WBTC: 62000, LINK: 14.5, UNI: 9.2, AAVE: 95, COMP: 52, BUSD: 1.00,
  CAKE: 2.8, AVAX: 38, OP: 2.1, ARB: 1.1,
};

const CONTRACT_TEMPLATES = [
  {
    id: "erc20-standard",
    name: "Standard ERC-20 Token",
    description: "A flexible ERC-20 token with optional minting, burning, and pause capabilities. Perfect for utility tokens, governance tokens, and DeFi protocols.",
    type: "ERC20",
    features: ["Mintable", "Burnable", "Pausable", "Transfer Fees", "Anti-Dump"],
    estimatedGasUsd: 8.50,
  },
  {
    id: "erc721-nft",
    name: "ERC-721 NFT Collection",
    description: "A full-featured NFT collection contract with whitelist support, reveal mechanics, royalties (EIP-2981), and configurable sale phases.",
    type: "ERC721",
    features: ["Whitelist", "Reveal", "Royalties", "Batch Mint", "Sale Phases"],
    estimatedGasUsd: 12.00,
  },
  {
    id: "erc1155-multi",
    name: "ERC-1155 Multi-Token",
    description: "A gas-efficient multi-token contract supporting both fungible and non-fungible tokens in a single deployment. Great for gaming items and collectibles.",
    type: "ERC1155",
    features: ["Multi-Token", "Batch Transfer", "Royalties", "URI Storage"],
    estimatedGasUsd: 10.00,
  },
];

const GAS_BY_CHAIN: Record<number, { gasPriceGwei: string; multiplier: number }> = {
  1: { gasPriceGwei: "25", multiplier: 1.0 },
  56: { gasPriceGwei: "3", multiplier: 0.1 },
  137: { gasPriceGwei: "100", multiplier: 0.05 },
  42161: { gasPriceGwei: "0.1", multiplier: 0.02 },
  10: { gasPriceGwei: "0.001", multiplier: 0.02 },
  43114: { gasPriceGwei: "25", multiplier: 0.4 },
  8453: { gasPriceGwei: "0.001", multiplier: 0.02 },
};

const NETWORKS = [
  { chainId: 1, name: "Ethereum", symbol: "ETH", decimals: 18, rpcUrl: "https://eth.llamarpc.com", explorerUrl: "https://etherscan.io", isTestnet: false, isEVM: true, averageBlockTime: 12 },
  { chainId: 56, name: "BNB Smart Chain", symbol: "BNB", decimals: 18, rpcUrl: "https://bsc-dataseed.binance.org", explorerUrl: "https://bscscan.com", isTestnet: false, isEVM: true, averageBlockTime: 3 },
  { chainId: 137, name: "Polygon", symbol: "MATIC", decimals: 18, rpcUrl: "https://polygon-rpc.com", explorerUrl: "https://polygonscan.com", isTestnet: false, isEVM: true, averageBlockTime: 2 },
  { chainId: 42161, name: "Arbitrum", symbol: "ETH", decimals: 18, rpcUrl: "https://arb1.arbitrum.io/rpc", explorerUrl: "https://arbiscan.io", isTestnet: false, isEVM: true, averageBlockTime: 1 },
  { chainId: 10, name: "Optimism", symbol: "ETH", decimals: 18, rpcUrl: "https://mainnet.optimism.io", explorerUrl: "https://optimistic.etherscan.io", isTestnet: false, isEVM: true, averageBlockTime: 2 },
  { chainId: 43114, name: "Avalanche", symbol: "AVAX", decimals: 18, rpcUrl: "https://api.avax.network/ext/bc/C/rpc", explorerUrl: "https://snowtrace.io", isTestnet: false, isEVM: true, averageBlockTime: 2 },
  { chainId: 8453, name: "Base", symbol: "ETH", decimals: 18, rpcUrl: "https://mainnet.base.org", explorerUrl: "https://basescan.org", isTestnet: false, isEVM: true, averageBlockTime: 2 },
  { chainId: 11155111, name: "Sepolia", symbol: "ETH", decimals: 18, rpcUrl: "https://rpc.sepolia.org", explorerUrl: "https://sepolia.etherscan.io", isTestnet: true, isEVM: true, averageBlockTime: 12 },
];

function generateTx(address: string, chainId: number, i: number) {
  const isOut = i % 2 === 0;
  const hash = "0x" + (address + i + chainId).split("").map(c => c.charCodeAt(0).toString(16)).join("").padEnd(64, "0").slice(0, 64);
  const ts = new Date(Date.now() - i * 3600000 * (i + 1)).toISOString();
  return {
    txHash: hash,
    chainId,
    blockNumber: String(18000000 - i * 100),
    fromAddress: isOut ? address : "0xabc" + i.toString().padStart(37, "0"),
    toAddress: isOut ? "0xdef" + i.toString().padStart(37, "0") : address,
    value: (Math.random() * 2).toFixed(6),
    valueUsd: Math.random() * 5000,
    tokenSymbol: ["ETH", "USDT", "USDC", "BNB"][i % 4],
    tokenAmount: (Math.random() * 100).toFixed(4),
    gasUsed: "21000",
    gasFeeEth: "0.002",
    gasFeeUsd: 6.40,
    status: i % 8 === 7 ? "failed" : "success",
    txType: ["transfer", "swap", "approve", "contract"][i % 4],
    decodedMethod: null,
    timestamp: ts,
  };
}

router.get("/tokens", (req, res) => {
  const chainId = parseInt(req.query.chainId as string) || 1;
  const search = (req.query.search as string)?.toLowerCase() || "";
  let tokens = TOKENS_BY_CHAIN[chainId] ?? TOKENS_BY_CHAIN[1];
  if (search) tokens = tokens.filter(t => t.symbol.toLowerCase().includes(search) || t.name.toLowerCase().includes(search));
  res.json(tokens);
});

router.get("/prices", (req, res) => {
  const symbols = (req.query.symbols as string)?.split(",") ?? [];
  const result: Record<string, number> = {};
  for (const sym of symbols) {
    const key = sym.trim().toUpperCase();
    if (PRICES[key] !== undefined) result[key] = PRICES[key];
  }
  res.json(result);
});

router.get("/prices/:symbol", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const price = PRICES[symbol];
  if (!price) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    symbol,
    priceUsd: price,
    priceChange24h: (Math.random() * 10 - 5),
    marketCapUsd: price * 1e9,
    volume24hUsd: price * 1e7,
    lastUpdated: new Date().toISOString(),
  });
});

router.get("/transactions", (req, res) => {
  const address = req.query.address as string;
  const chainId = parseInt(req.query.chainId as string) || 1;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  if (!address) { res.status(400).json({ error: "address is required" }); return; }
  const total = 47;
  const items = Array.from({ length: Math.min(limit, total - (page - 1) * limit) }, (_, i) =>
    generateTx(address, chainId, (page - 1) * limit + i)
  );
  res.json({ items, total, page, limit });
});

router.get("/contracts/templates", (_req, res) => {
  res.json(CONTRACT_TEMPLATES);
});

router.post("/contracts/estimate-gas", (req, res) => {
  const { contractType, chainId = 1 } = req.body;
  const gasInfo = GAS_BY_CHAIN[chainId] ?? GAS_BY_CHAIN[1];
  const baseGas = contractType === "ERC721" ? 2500000 : contractType === "ERC1155" ? 2200000 : 1800000;
  const estimatedEthRaw = (baseGas * parseFloat(gasInfo.gasPriceGwei) * 1e-9 * gasInfo.multiplier).toFixed(6);
  const estimatedUsd = parseFloat(estimatedEthRaw) * (PRICES.ETH || 3200) * gasInfo.multiplier;
  res.json({
    gasUnits: baseGas.toLocaleString(),
    gasPriceGwei: gasInfo.gasPriceGwei,
    estimatedEth: estimatedEthRaw,
    estimatedUsd: parseFloat(estimatedUsd.toFixed(2)),
  });
});

router.get("/networks", (_req, res) => {
  res.json(NETWORKS);
});

router.get("/networks/:chainId", (req, res) => {
  const chainId = parseInt(req.params.chainId);
  const network = NETWORKS.find(n => n.chainId === chainId);
  if (!network) { res.status(404).json({ error: "Network not found" }); return; }
  res.json(network);
});

export default router;
