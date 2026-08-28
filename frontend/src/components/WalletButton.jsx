import { useState, useRef, useEffect, useCallback } from 'react';
import { useWeb3 } from '../lib/web3.jsx';
import { Wallet, ChevronDown, Copy, LogOut, Check, Loader2, X } from 'lucide-react';

export function WalletButton() {
  const {
    address,
    walletName,
    balance,
    chainId,
    connecting,
    connectWallet,
    disconnectWallet,
    supportedWallets,
    chainConfig,
    isWalletInstalled,
  } = useWeb3();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [installedWallets, setInstalledWallets] = useState({});
  const [connectingWalletId, setConnectingWalletId] = useState(null);
  const ref = useRef(null);

  const refreshInstalledWallets = useCallback(() => {
    const next = {};
    Object.values(supportedWallets).forEach((wallet) => {
      next[wallet.id] = isWalletInstalled(wallet.id);
    });
    setInstalledWallets(next);
  }, [supportedWallets, isWalletInstalled]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (walletModalOpen) {
      refreshInstalledWallets();
    }
  }, [walletModalOpen, refreshInstalledWallets]);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const chainName = Object.entries(chainConfig).find(([, c]) => c.chainId === chainId)?.[0];

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleWalletClick = async (wallet) => {
    setError(null);
    refreshInstalledWallets();

    const isInstalled = isWalletInstalled(wallet.id);

    if (!isInstalled) {
      window.open(wallet.installUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setConnectingWalletId(wallet.id);
    try {
      await connectWallet(wallet.id);
      setWalletModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to connect');
    } finally {
      setConnectingWalletId(null);
    }
  };

  if (address) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="btn-ghost text-sm gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {shortAddress}
          <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 card p-3 z-50 animate-fade-in">
            <div className="px-2 py-2 border-b border-border mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Connected with</span>
                <span className="text-xs text-gray-400">{walletName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-200">{shortAddress}</span>
                <button onClick={handleCopy} className="text-gray-500 hover:text-primary transition-colors">
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
            {balance && (
              <div className="px-2 py-1.5 flex items-center justify-between text-sm">
                <span className="text-gray-500">Balance</span>
                <span className="text-gray-200 font-medium">{parseFloat(balance).toFixed(4)} {chainConfig[chainName]?.symbol || 'ETH'}</span>
              </div>
            )}
            {chainName && (
              <div className="px-2 py-1.5 flex items-center justify-between text-sm">
                <span className="text-gray-500">Network</span>
                <span className="text-gray-200">{chainConfig[chainName]?.name}</span>
              </div>
            )}
            <button
              onClick={() => { disconnectWallet(); setDropdownOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-2 mt-2 text-sm text-gray-400 hover:text-red-400 rounded-lg hover:bg-bg-elev transition-colors"
            >
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setWalletModalOpen(true)}
        disabled={connecting}
        className="btn-ghost text-sm"
      >
        {connecting ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />}
        Connect Wallet
      </button>

      {walletModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setWalletModalOpen(false)}
        >
          <div
            className="card p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Connect a wallet</h2>
              <button onClick={() => setWalletModalOpen(false)} className="text-gray-500 hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <p className="text-sm text-gray-500 mb-4">
              Choose how you want to connect. This will let you pay for AI agent runs with crypto.
            </p>

            <div className="space-y-2">
              {Object.values(supportedWallets).map((wallet) => {
                const isInstalled = installedWallets[wallet.id] ?? isWalletInstalled(wallet.id);
                const isConnecting = connectingWalletId === wallet.id;

                return (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => handleWalletClick(wallet)}
                    disabled={isConnecting}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-border-hover hover:bg-bg-elev transition-colors text-left disabled:opacity-50"
                  >
                    <img src={wallet.icon} alt={wallet.name} className="w-6 h-6" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">{wallet.name}</p>
                      <p className={`text-xs ${isInstalled ? 'text-emerald-400' : 'text-primary'}`}>
                        {isInstalled ? 'Connect wallet' : 'Install wallet'}
                      </p>
                    </div>
                    {isConnecting && (
                      <Loader2 size={16} className="animate-spin text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-600 mt-4 text-center">
              By connecting, you agree to the Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
