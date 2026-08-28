import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Globe } from 'lucide-react';
import { RatingStars } from './RatingStars.jsx';
import { PricingBadge } from './PricingBadge.jsx';

const CHAIN_LABELS = {
  ethereum: 'ETH',
  polygon: 'MATIC',
  base: 'Base',
  arbitrum: 'Arb',
  solana: 'SOL',
};

export function AgentCard({ agent }) {
  const initials = agent.name.slice(0, 2).toUpperCase();
  const hue = hashHue(agent.name);

  return (
    <Link to={`/agent/${agent.slug}`} className="card card-hover p-5 flex flex-col gap-4 group">
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${hue}, 70%, 25%), hsl(${(hue + 40) % 360}, 70%, 18%))`,
            color: `hsl(${hue}, 80%, 75%)`,
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-100 truncate group-hover:text-primary transition-colors">
              {agent.name}
            </h3>
            {agent.is_verified && <ShieldCheck size={15} className="text-primary shrink-0" />}
            {agent.is_web3 && (
              <span className="badge bg-violet-500/10 text-violet-300 border border-violet-500/20 shrink-0">
                <Globe size={10} /> {CHAIN_LABELS[agent.chain] || 'Web3'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {agent.creator?.username ? `@${agent.creator.username}` : 'Unknown'}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">
        {agent.tagline || agent.description?.slice(0, 100) || 'No description available.'}
      </p>

      {agent.capabilities && agent.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {agent.capabilities.slice(0, 3).map((cap) => (
            <span key={cap} className="badge bg-bg-elev text-gray-400 border border-border">
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="badge text-gray-500">+{agent.capabilities.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <TrendingUp size={13} /> {formatCount(agent.runs_count)}
          </span>
          <RatingStars value={agent.rating_avg} showValue count={agent.rating_count} />
        </div>
        <PricingBadge
          model={agent.pricing_model}
          price={agent.price_per_run}
          isWeb3={agent.is_web3}
          cryptoSymbol={agent.price_crypto_symbol}
          cryptoPrice={agent.price_crypto}
        />
      </div>
    </Link>
  );
}

export function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

export function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}
