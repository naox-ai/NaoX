import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { useWeb3 } from '../lib/web3.jsx';
import { RatingStars } from '../components/RatingStars.jsx';
import { PricingBadge } from '../components/PricingBadge.jsx';
import {
  ShieldCheck, Cpu, TrendingUp, ArrowLeft, ExternalLink, GitBranch,
  Rocket, Check, Loader2, MessageSquare, Send, Trash2, Star, Zap, Globe,
  Bitcoin, AlertCircle, Hash
} from 'lucide-react';
import { hashHue, formatCount } from '../components/AgentCard.jsx';

const CHAIN_LABELS = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  base: 'Base',
  arbitrum: 'Arbitrum',
  solana: 'Solana',
};

export function AgentDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { address, sendPayment } = useWeb3();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  const loadAgent = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('agents')
      .select('*, category:categories(*), creator:profiles!agents_creator_id_fkey(*)')
      .eq('slug', slug)
      .maybeSingle();
    if (error) console.error(error.message);
    setAgent(data);
    setLoading(false);
  }, [slug]);

  const loadReviews = useCallback(async () => {
    if (!agent?.id) return;
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles:profiles!reviews_user_id_fkey(id, username, full_name, avatar_url)')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false });
    if (data) {
      setReviews(data);
      if (user) {
        setUserReview(data.find((r) => r.user_id === user.id) ?? null);
      }
    }
  }, [agent?.id, user]);

  const loadDeployment = useCallback(async () => {
    if (!user || !agent) return;
    const { data } = await supabase
      .from('deployments')
      .select('*')
      .eq('agent_id', agent.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setDeployment(data);
  }, [user, agent]);

  useEffect(() => { loadAgent(); }, [loadAgent]);
  useEffect(() => { if (agent) loadReviews(); }, [loadReviews]);
  useEffect(() => { if (user && agent) loadDeployment(); }, [loadDeployment]);

  const handleDeploy = async () => {
    if (!user) { navigate('/signin'); return; }
    if (!agent) return;
    setDeploying(true);
    if (deployment) {
      await supabase.from('deployments').delete().eq('id', deployment.id);
      setDeployment(null);
    } else {
      const { data, error } = await supabase
        .from('deployments')
        .insert({ agent_id: agent.id, user_id: user.id, status: 'active' })
        .select('*')
        .maybeSingle();
      if (!error && data) setDeployment(data);
    }
    setDeploying(false);
  };

  const handleCryptoPayment = async () => {
    setPaymentError(null);
    setPaymentStatus(null);

    if (!user) { navigate('/signin'); return; }
    if (!agent) return;

    if (!address) {
      setPaymentError('Please connect your wallet first to pay with crypto.');
      return;
    }

    const creatorWallet = agent.creator?.wallet_address;
    if (!creatorWallet) {
      setPaymentError('This agent creator has not set a wallet address for payments.');
      return;
    }

    const amount = agent.price_crypto;
    if (!amount || amount <= 0) {
      setPaymentError('Invalid payment amount.');
      return;
    }

    setPaying(true);
    setPaymentStatus('Preparing transaction...');

    try {
      setPaymentStatus('Waiting for wallet confirmation...');
      const result = await sendPayment(creatorWallet, amount, agent.chain);
      setPaymentStatus('Transaction submitted. Waiting for confirmation...');

      const receipt = await result.wait();
      setPaymentStatus('Payment confirmed!');

      await supabase.from('payments').insert({
        agent_id: agent.id,
        user_id: user.id,
        wallet_address: address,
        tx_hash: receipt.hash,
        amount: amount,
        token_symbol: agent.price_crypto_symbol || 'ETH',
        chain: agent.chain || 'ethereum',
        status: 'confirmed',
      });

      setTimeout(() => {
        setPaymentStatus(null);
        setPaying(false);
      }, 3000);
    } catch (err) {
      const msg = err.code === 'ACTION_REJECTED'
        ? 'Transaction rejected by wallet.'
        : err.shortMessage || err.message || 'Payment failed.';
      setPaymentError(msg);
      setPaymentStatus(null);
      setPaying(false);
    }
  };

  const submitReview = async () => {
    if (!user || !agent) return;
    if (!reviewText.trim() && reviewRating === 0) return;
    setSubmittingReview(true);
    if (userReview) {
      const { error } = await supabase
        .from('reviews')
        .update({ rating: reviewRating, comment: reviewText.trim() || null })
        .eq('id', userReview.id);
      if (!error) {
        setUserReview({ ...userReview, rating: reviewRating, comment: reviewText.trim() || null });
      }
    } else {
      const { data, error } = await supabase
        .from('reviews')
        .insert({ agent_id: agent.id, user_id: user.id, rating: reviewRating, comment: reviewText.trim() || null })
        .select('*, profiles:profiles!reviews_user_id_fkey(id, username, full_name, avatar_url)')
        .maybeSingle();
      if (!error && data) {
        setUserReview(data);
      }
    }
    setSubmittingReview(false);
    setReviewText('');
    loadReviews();
    loadAgent();
  };

  const deleteReview = async () => {
    if (!userReview) return;
    await supabase.from('reviews').delete().eq('id', userReview.id);
    setUserReview(null);
    setReviewText('');
    setReviewRating(5);
    loadReviews();
    loadAgent();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-gray-400 mb-4">Agent not found.</p>
        <Link to="/" className="btn-ghost">Back to explore</Link>
      </div>
    );
  }

  const isOwner = user?.id === agent.creator_id;
  const hue = hashHue(agent.name);
  const isWeb3Paid = agent.is_web3 && agent.price_crypto > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to explore
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue}, 70%, 25%), hsl(${(hue + 40) % 360}, 70%, 18%))`,
                  color: `hsl(${hue}, 80%, 75%)`,
                }}
              >
                {agent.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-100">{agent.name}</h1>
                  {agent.is_verified && (
                    <span className="badge bg-primary/10 text-primary border border-primary/20">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  )}
                  {agent.is_web3 && (
                    <span className="badge bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      <Globe size={12} /> {CHAIN_LABELS[agent.chain] || 'Web3'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  by <span className="text-gray-400 hover:text-primary">@{agent.creator?.username}</span>
                  {agent.category && (
                    <>
                      {' '}in <Link to={`/?cat=${agent.category.slug}`} className="text-gray-400 hover:text-primary">{agent.category.name}</Link>
                    </>
                  )}
                </p>
              </div>
            </div>

            {agent.tagline && (
              <p className="text-lg text-gray-300 mb-4">{agent.tagline}</p>
            )}

            {agent.description && (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">{agent.description}</p>
              </div>
            )}

            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Capabilities</h3>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap) => (
                    <span key={cap} className="badge bg-bg-elev text-gray-300 border border-border">
                      <Zap size={11} className="text-primary" /> {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {agent.is_web3 && (
              <div className="mt-6 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <h3 className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
                  <Bitcoin size={15} /> On-chain Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Chain</span>
                    <p className="text-gray-200">{CHAIN_LABELS[agent.chain] || agent.chain}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Price per run</span>
                    <p className="text-gray-200">{agent.price_crypto} {agent.price_crypto_symbol || 'ETH'}</p>
                  </div>
                  {agent.contract_address && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Contract address</span>
                      <p className="text-gray-200 font-mono text-xs break-all">{agent.contract_address}</p>
                    </div>
                  )}
                  {agent.token_address && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Token address</span>
                      <p className="text-gray-200 font-mono text-xs break-all">{agent.token_address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <MessageSquare size={18} /> Reviews
                <span className="text-gray-500 font-normal text-sm">({reviews.length})</span>
              </h2>
              {agent.rating_count > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-100">{agent.rating_avg.toFixed(1)}</span>
                  <RatingStars value={agent.rating_avg} size={16} />
                </div>
              )}
            </div>

            {user && !isOwner && (
              <div className="mb-6 p-4 bg-bg-elev rounded-xl border border-border">
                <p className="text-sm text-gray-400 mb-3">
                  {userReview ? 'Update your review' : 'Leave a review'}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setReviewRating(n)} className="transition-transform hover:scale-110">
                      <Star size={22} className={n <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this agent..."
                  rows={3}
                  className="input mb-3 resize-none"
                />
                <div className="flex items-center gap-2">
                  <button onClick={submitReview} disabled={submittingReview} className="btn-primary text-sm">
                    {submittingReview ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    {userReview ? 'Update' : 'Post review'}
                  </button>
                  {userReview && (
                    <button onClick={deleteReview} className="btn-ghost text-sm text-gray-500">
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="flex gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="w-9 h-9 rounded-full bg-bg-elev border border-border flex items-center justify-center text-sm font-semibold text-gray-400 shrink-0">
                      {r.profiles?.username?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div>
                          <span className="text-sm font-medium text-gray-200">
                            {r.profiles?.full_name || r.profiles?.username || 'Anonymous'}
                          </span>
                          {r.user_id === user?.id && (
                            <span className="text-xs text-primary ml-2">You</span>
                          )}
                        </div>
                        <RatingStars value={r.rating} size={13} />
                      </div>
                      {r.comment && <p className="text-sm text-gray-400 mt-1">{r.comment}</p>}
                      <p className="text-xs text-gray-600 mt-1.5">
                        {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-20 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">Pricing</span>
                <PricingBadge
                  model={agent.pricing_model}
                  price={agent.price_per_run}
                  isWeb3={agent.is_web3}
                  cryptoSymbol={agent.price_crypto_symbol}
                  cryptoPrice={agent.price_crypto}
                />
              </div>
              {isWeb3Paid && (
                <p className="text-2xl font-bold text-gray-100">
                  {agent.price_crypto} <span className="text-sm font-normal text-gray-500">{agent.price_crypto_symbol || 'ETH'} / run</span>
                </p>
              )}
              {agent.pricing_model === 'paid' && agent.price_per_run > 0 && !isWeb3Paid && (
                <p className="text-2xl font-bold text-gray-100">
                  {agent.price_per_run} <span className="text-sm font-normal text-gray-500">credits / run</span>
                </p>
              )}
            </div>

            {/* Crypto payment section */}
            {isWeb3Paid && !isOwner && (
              <div className="space-y-3">
                {paymentError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" /> {paymentError}
                  </div>
                )}
                {paymentStatus && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                    <Loader2 size={14} className="animate-spin" /> {paymentStatus}
                  </div>
                )}
                <button
                  onClick={handleCryptoPayment}
                  disabled={paying}
                  className="w-full btn-primary justify-center"
                >
                  {paying ? <Loader2 size={16} className="animate-spin" /> : <Bitcoin size={16} />}
                  Pay {agent.price_crypto} {agent.price_crypto_symbol || 'ETH'}
                </button>
                {!address && (
                  <p className="text-xs text-gray-500 text-center">Connect wallet to pay with crypto</p>
                )}
              </div>
            )}

            <button
              onClick={handleDeploy}
              disabled={deploying || isOwner}
              className={`w-full ${deployment ? 'btn-ghost' : 'btn-primary'} justify-center ${isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {deploying ? (
                <Loader2 size={16} className="animate-spin" />
              ) : deployment ? (
                <><Check size={16} /> Deployed — Click to undeploy</>
              ) : (
                <><Rocket size={16} /> Deploy Agent</>
              )}
            </button>
            {isOwner && <p className="text-xs text-gray-500 text-center">You can&apos;t deploy your own agent</p>}
            {!user && <p className="text-xs text-gray-500 text-center">Sign in to deploy</p>}

            <div className="space-y-3 pt-4 border-t border-border">
              <StatRow icon={<TrendingUp size={15} />} label="Total runs" value={formatCount(agent.runs_count)} />
              <StatRow icon={<Cpu size={15} />} label="Status" value={<span className="text-emerald-400">Operational</span>} />
              <StatRow icon={<Star size={15} />} label="Rating" value={`${agent.rating_avg.toFixed(1)} (${agent.rating_count})`} />
              {agent.is_web3 && (
                <StatRow icon={<Globe size={15} />} label="Chain" value={CHAIN_LABELS[agent.chain] || agent.chain} />
              )}
            </div>

            {(agent.api_endpoint || agent.repo_url || agent.contract_address) && (
              <div className="space-y-2 pt-4 border-t border-border">
                {agent.contract_address && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Hash size={14} /> Contract <ExternalLink size={11} className="ml-auto" />
                  </div>
                )}
                {agent.api_endpoint && (
                  <a href={agent.api_endpoint} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
                    <Globe size={14} /> API endpoint <ExternalLink size={11} className="ml-auto" />
                  </a>
                )}
                {agent.repo_url && (
                  <a href={agent.repo_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
                    <GitBranch size={14} /> Source repo <ExternalLink size={11} className="ml-auto" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 inline-flex items-center gap-2">{icon} {label}</span>
      <span className="text-gray-200 font-medium">{value}</span>
    </div>
  );
}
