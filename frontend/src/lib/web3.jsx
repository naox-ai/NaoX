import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserProvider, formatEther, parseEther } from 'ethers';
import metamaskicon from '../../public/assets/img/metamask.png';
import coinbaseicon from '../../public/assets/img/coinbase.png';
import phantomicon from '../../public/assets/img/phantom.png';

const Web3Context = createContext(undefined);

function isMetaMaskProvider(provider) {
  return Boolean(
    provider?.isMetaMask
    && !provider?.isCoinbaseWallet
    && !provider?.isPhantom
    && !provider?.isBraveWallet,
  );
}

function getEthereumProviders() {
  if (typeof window === 'undefined' || !window.ethereum) return [];
  if (window.ethereum.providers?.length) return window.ethereum.providers;
  return [window.ethereum];
}

const SUPPORTED_WALLETS = {
  metamask: {
    name: 'MetaMask',
    id: 'metamask',
    icon: metamaskicon,
    getProvider: () => {
      const provider = getEthereumProviders().find(isMetaMaskProvider);
      return provider || null;
    },
    installUrl: 'https://metamask.io/download/',
  },
  coinbase: {
    name: 'Coinbase Wallet',
    id: 'coinbase',
    icon: coinbaseicon,
    getProvider: () => {
      if (typeof window !== 'undefined' && window.coinbaseWalletExtension) {
        return window.coinbaseWalletExtension;
      }
      const provider = getEthereumProviders().find((p) => p.isCoinbaseWallet);
      return provider || null;
    },
    installUrl: 'https://www.coinbase.com/wallet/downloads',
  },
  phantom: {
    name: 'Phantom',
    id: 'phantom',
    icon: phantomicon,
    getProvider: () => {
      if (typeof window !== 'undefined' && window.phantom?.ethereum) {
        return window.phantom.ethereum;
      }
      const provider = getEthereumProviders().find((p) => p.isPhantom);
      return provider || null;
    },
    installUrl: 'https://phantom.app/download',
  },
};

const CHAIN_CONFIG = {
  ethereum: { name: 'Ethereum', symbol: 'ETH', chainId: 1, explorer: 'https://etherscan.io' },
  polygon: { name: 'Polygon', symbol: 'MATIC', chainId: 137, explorer: 'https://polygonscan.com' },
  base: { name: 'Base', symbol: 'ETH', chainId: 8453, explorer: 'https://basescan.org' },
  arbitrum: { name: 'Arbitrum', symbol: 'ETH', chainId: 42161, explorer: 'https://arbiscan.io' },
  solana: { name: 'Solana', symbol: 'SOL', chainId: 0, explorer: 'https://solscan.io' },
};

const WALLET_STORAGE_KEY = 'agentmesh_wallet_id';

function getStoredWalletId() {
  if (typeof window === 'undefined') return null;
  const walletId = localStorage.getItem(WALLET_STORAGE_KEY);
  return walletId && SUPPORTED_WALLETS[walletId] ? walletId : null;
}

function setStoredWalletId(walletId) {
  if (typeof window === 'undefined') return;
  if (walletId) {
    localStorage.setItem(WALLET_STORAGE_KEY, walletId);
  } else {
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }
}

export function isWalletInstalled(walletId) {
  const wallet = SUPPORTED_WALLETS[walletId];
  return wallet ? Boolean(wallet.getProvider()) : false;
}

export function Web3Provider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [walletName, setWalletName] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);

  const refreshBalance = useCallback(async (prov, addr) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance(formatEther(bal));
    } catch {
      setBalance(null);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setWalletName(null);
    setProvider(null);
    setError(null);
    setStoredWalletId(null);
  }, []);

  const attachProviderListeners = useCallback((rawProvider, ethersProvider) => {
    rawProvider.removeAllListeners('accountsChanged');
    rawProvider.on('accountsChanged', (newAccounts) => {
      if (newAccounts.length === 0) {
        disconnectWallet();
      } else {
        setAddress(newAccounts[0]);
        refreshBalance(ethersProvider, newAccounts[0]);
      }
    });

    rawProvider.removeAllListeners('chainChanged');
    rawProvider.on('chainChanged', () => {
      window.location.reload();
    });
  }, [disconnectWallet, refreshBalance]);

  const connectWallet = useCallback(async (walletId) => {
    setError(null);
    setConnecting(true);
    try {
      const wallet = SUPPORTED_WALLETS[walletId];
      if (!wallet) throw new Error('Unknown wallet');

      const rawProvider = wallet.getProvider();
      if (!rawProvider) {
        throw new Error(`${wallet.name} is not installed.`);
      }

      const accounts = await rawProvider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned');
      }

      const ethersProvider = new BrowserProvider(rawProvider);
      const network = await ethersProvider.getNetwork();

      setAddress(accounts[0]);
      setChainId(Number(network.chainId));
      setWalletName(wallet.name);
      setProvider(ethersProvider);
      setStoredWalletId(walletId);
      setConnecting(false);

      await refreshBalance(ethersProvider, accounts[0]);
      attachProviderListeners(rawProvider, ethersProvider);

      return { address: accounts[0], provider: ethersProvider };
    } catch (err) {
      setConnecting(false);
      const msg = err.code === 4001 ? 'Connection rejected' : err.message || 'Failed to connect';
      setError(msg);
      throw err;
    }
  }, [refreshBalance, attachProviderListeners]);

  const sendPayment = useCallback(async (toAddress, amountEth, chainName) => {
    if (!provider || !address) {
      throw new Error('Wallet not connected');
    }
    if (!toAddress || !toAddress.startsWith('0x')) {
      throw new Error('Invalid recipient address');
    }

    const tx = await provider.sendTransaction({
      to: toAddress,
      value: parseEther(String(amountEth)),
      from: address,
    });

    return {
      txHash: tx.hash,
      wait: () => tx.wait(),
    };
  }, [provider, address]);

  // Auto-reconnect through the wallet the user originally chose
  useEffect(() => {
    const tryReconnect = async () => {
      const walletId = getStoredWalletId();
      if (!walletId) return;

      const wallet = SUPPORTED_WALLETS[walletId];
      const rawProvider = wallet.getProvider();
      if (!rawProvider) return;

      try {
        const accounts = await rawProvider.request({ method: 'eth_accounts' });
        if (!accounts?.length) return;

        const ethersProvider = new BrowserProvider(rawProvider);
        const network = await ethersProvider.getNetwork();

        setAddress(accounts[0]);
        setChainId(Number(network.chainId));
        setWalletName(wallet.name);
        setProvider(ethersProvider);
        await refreshBalance(ethersProvider, accounts[0]);
        attachProviderListeners(rawProvider, ethersProvider);
      } catch {
        // Silent fail on reconnect
      }
    };
    tryReconnect();
  }, [refreshBalance, attachProviderListeners]);

  const value = {
    address,
    chainId,
    balance,
    walletName,
    connecting,
    error,
    provider,
    supportedWallets: SUPPORTED_WALLETS,
    chainConfig: CHAIN_CONFIG,
    isWalletInstalled,
    connectWallet,
    disconnectWallet,
    sendPayment,
    refreshBalance: () => provider && address && refreshBalance(provider, address),
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 must be used within Web3Provider');
  return ctx;
}
