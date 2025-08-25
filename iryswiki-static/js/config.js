/**
 * IRYSWIKI Configuration
 */
const IRYSWIKI_CONFIG = {
  // Irys blockchain configuration
  blockchain: {
    ticker: 'IRYS',
    decimals: 18,
    chainId: 1270,
    rpcUrl: 'https://testnet-rpc.irys.xyz/v1/execution-rpc',
    irysNode: 'https://node1.irys.xyz',
    irysNetwork: 'testnet',
    explorerUrl: 'https://testnet.irys.xyz',
  },
  
  // Wallet for content payments
  paymentWallet: '0x601F9e84D3B5621131896dF22268B898729a259F',
  
  // Transaction fees (in IRYS)
  fees: {
    THREAD: '0.0003',  // IRYS per thread
    REPLY: '0.0001',   // IRYS per reply
    PROFILE: '0.0002', // IRYS per profile creation/update
  },
  
  // Application settings
  app: {
    name: 'IRYSWIKI',
    description: 'Decentralized Wiki on Irys Blockchain',
    version: '1.0.0',
  },
  
  // Storage settings
  storage: {
    keys: {
      THREADS: 'iryswiki_threads',
      PROFILES: 'iryswiki_profiles',
      VERIFIED_TRANSACTIONS: 'iryswiki_verified_txs',
    },
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  
  // Thread categories
  threadCategories: [
    {
      id: 'general',
      name: 'General Discussion',
      description: 'Open discussions about any topic',
      cssClass: 'category-general',
      icon: '💬'
    },
    {
      id: 'blockchain',
      name: 'Blockchain & Crypto',
      description: 'Discussions about blockchain technology and cryptocurrencies',
      cssClass: 'category-blockchain',
      icon: '⛓️'
    },
    {
      id: 'development',
      name: 'Development',
      description: 'Programming, development, and technical discussions',
      cssClass: 'category-development',
      icon: '💻'
    },
    {
      id: 'tutorials',
      name: 'Tutorials & Guides',
      description: 'How-to guides and educational content',
      cssClass: 'category-tutorials',
      icon: '📚'
    },
    {
      id: 'announcements',
      name: 'Announcements',
      description: 'Official announcements and updates',
      cssClass: 'category-announcements',
      icon: '📢'
    }
  ],
  
  // Network settings for adding to MetaMask
  networkConfig: {
    chainId: 1270,
    chainName: 'Irys Testnet',
    nativeCurrency: {
      name: 'IRYS',
      symbol: 'IRYS',
      decimals: 18,
    },
    rpcUrls: ['https://testnet-rpc.irys.xyz/v1/execution-rpc'],
    blockExplorerUrls: ['https://testnet.irys.xyz'],
  },
};