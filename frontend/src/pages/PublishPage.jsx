import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { useWeb3 } from '../lib/web3.jsx';
import { Loader2, Plus, X, Rocket, AlertCircle, Check, Bitcoin, Wallet } from 'lucide-react';

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'base', name: 'Base', symbol: 'ETH' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
];

const CRYPTO_SYMBOLS = ['ETH', 'MATIC', 'SOL', 'USDC', 'USDT', 'WBTC', 'DAI'];

export function PublishPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { address, connectWallet, walletName } = useWeb3();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [pricingModel, setPricingModel] = useState('free');
  const [pricePerRun, setPricePerRun] = useState(0);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [capabilities, setCapabilities] = useState([]);
  const [capabilityInput, setCapabilityInput] = useState('');
  const [status, setStatus] = useState('draft');

  // Web3 fields
  const [isWeb3, setIsWeb3] = useState(false);
  const [chain, setChain] = useState('ethereum');
  const [priceCrypto, setPriceCrypto] = useState(0);
  const [cryptoSymbol, setCryptoSymbol] = useState('ETH');
  const [contractAddress, setContractAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const addCapability = () => {
    const v = capabilityInput.trim();
    if (v && !capabilities.includes(v) && capabilities.length < 10) {
      setCapabilities([...capabilities, v]);
      setCapabilityInput('');
    }
  };

  const slugify = (s) =>
    s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const handleConnectWalletForPublish = async () => {
    try {
      await connectWallet('metamask');
    } catch {
      // Error handled in context
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) { navigate('/signin'); return; }
    if (name.trim().length < 3) { setError('Agent name must be at least 3 characters.'); return; }
    if (!tagline.trim()) { setError('Please add a short tagline.'); return; }
    if (!description.trim()) { setError('Please add a description.'); return; }

    if (isWeb3 && priceCrypto > 0 && !profile?.wallet_address && !address) {
      setError('Please connect a wallet or set a wallet address in your profile to receive crypto payments.');
      return;
    }

    setLoading(true);
    const slug = slugify(name) + '-' + Math.random().toString(36).slice(2, 6);

    // Save wallet address to profile if connected
    let creatorWallet = profile?.wallet_address;
    if (!creatorWallet && address) {
      creatorWallet = address;
      await supabase.from('profiles').update({ wallet_address: address }).eq('id', user.id);
      refreshProfile();
    }

    if (!profile?.is_creator) {
      await supabase.from('profiles').update({ is_creator: true }).eq('id', user.id);
      refreshProfile();
    }

    const { data, error } = await supabase
      .from('agents')
      .insert({
        creator_id: user.id,
        category_id: categoryId || null,
        name: name.trim(),
        slug,
        tagline: tagline.trim(),
        description: description.trim(),
        capabilities,
        pricing_model: pricingModel,
        price_per_run: pricingModel === 'paid' ? pricePerRun : 0,
        api_endpoint: apiEndpoint.trim() || null,
        repo_url: repoUrl.trim() || null,
        status,
        is_web3: isWeb3,
        chain: isWeb3 ? chain : 'ethereum',
        price_crypto: isWeb3 ? priceCrypto : 0,
        price_crypto_symbol: isWeb3 ? cryptoSymbol : null,
        contract_address: isWeb3 ? contractAddress.trim() || null : null,
        token_address: isWeb3 ? tokenAddress.trim() || null : null,
      })
      .select('id, slug')
      .maybeSingle();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(status === 'published' ? 'Agent published successfully!' : 'Draft saved!');
    setLoading(false);
    setTimeout(() => navigate(`/agent/${data?.slug}`), 1200);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Publish a new agent</h1>
        <p className="text-gray-500">List your AI agent on the decentralized marketplace for the world to discover.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 mb-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
          <Check size={15} /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Basic Info</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Agent name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="CodeReviewer Pro" className="input" required />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Tagline *</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Automated code review with AI" className="input" required maxLength={120} />
            <p className="text-xs text-gray-600 mt-1">{tagline.length}/120</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what your agent does, its use cases, and why it's valuable..." rows={5} className="input resize-none" required />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
              <option value="">Select a category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Capabilities</h2>
          <div>
            <div className="flex gap-2">
              <input
                value={capabilityInput}
                onChange={(e) => setCapabilityInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCapability(); } }}
                placeholder="e.g. Code generation"
                className="input"
                maxLength={30}
              />
              <button type="button" onClick={addCapability} className="btn-ghost shrink-0">
                <Plus size={16} /> Add
              </button>
            </div>
            {capabilities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {capabilities.map((cap) => (
                  <span key={cap} className="badge bg-bg-elev text-gray-300 border border-border">
                    {cap}
                    <button type="button" onClick={() => setCapabilities(capabilities.filter((c) => c !== cap))} className="ml-1 text-gray-500 hover:text-red-400">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Web3 Section */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <Bitcoin size={16} className="text-violet-400" /> Web3 / Crypto Payments
            </h2>
            <button
              type="button"
              onClick={() => setIsWeb3(!isWeb3)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isWeb3 ? 'bg-violet-500' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isWeb3 ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {isWeb3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 text-sm text-gray-400">
                Enable crypto payments for this agent. Users will pay with their connected wallet (MetaMask, Coinbase, Phantom) per agent run.
              </div>

              {/* Wallet connection status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elev border border-border">
                <Wallet size={16} className={address ? 'text-emerald-400' : 'text-gray-500'} />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    {address
                      ? `Connected: ${address.slice(0, 8)}...${address.slice(-6)}`
                      : profile?.wallet_address
                        ? `Profile wallet: ${profile.wallet_address.slice(0, 8)}...${profile.wallet_address.slice(-6)}`
                        : 'No wallet connected'
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {address ? `Via ${walletName}` : 'Payments will be sent to this address'}
                  </p>
                </div>
                {!address && (
                  <button type="button" onClick={handleConnectWalletForPublish} className="btn-ghost text-xs">
                    Connect
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Blockchain</label>
                  <select value={chain} onChange={(e) => setChain(e.target.value)} className="input">
                    {CHAINS.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Payment token</label>
                  <select value={cryptoSymbol} onChange={(e) => setCryptoSymbol(e.target.value)} className="input">
                    {CRYPTO_SYMBOLS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Price per run ({cryptoSymbol})</label>
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  value={priceCrypto}
                  onChange={(e) => setPriceCrypto(Number(e.target.value))}
                  className="input"
                  placeholder="0.01"
                />
                <p className="text-xs text-gray-600 mt-1">Set to 0 for free Web3 agent</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Contract address <span className="text-gray-600">(optional)</span></label>
                <input
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x..."
                  className="input font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Token address <span className="text-gray-600">(optional, for ERC-20 payments)</span></label>
                <input
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="0x..."
                  className="input font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Pricing (Credits)</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Pricing model</label>
            <div className="grid grid-cols-3 gap-2">
              {['free', 'freemium', 'paid'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPricingModel(m)}
                  className={`p-3 rounded-xl border text-sm font-medium capitalize transition-colors ${
                    pricingModel === m
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-gray-400 hover:border-border-hover'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {pricingModel === 'paid' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Price per run (credits)</label>
              <input type="number" min={0} step="0.01" value={pricePerRun} onChange={(e) => setPricePerRun(Number(e.target.value))} className="input" />
            </div>
          )}
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Integration</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">API endpoint</label>
            <input value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} placeholder="https://api.your-agent.com/v1/run" className="input" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Source / repo URL</label>
            <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/you/your-agent" className="input" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} onClick={() => setStatus('draft')} className="btn-ghost">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Save as draft
          </button>
          <button type="submit" disabled={loading} onClick={() => setStatus('published')} className="btn-primary">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
            Publish agent
          </button>
        </div>
      </form>
    </div>
  );
}
