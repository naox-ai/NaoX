import { Sparkles, Coins, Bitcoin } from 'lucide-react';

export function PricingBadge({ model, price, isWeb3, cryptoSymbol, cryptoPrice }) {
  if (isWeb3 && cryptoPrice && cryptoPrice > 0) {
    return (
      <span className="badge bg-violet-500/10 text-violet-300 border border-violet-500/20">
        <Bitcoin size={12} /> {cryptoPrice} {cryptoSymbol || 'ETH'}
      </span>
    );
  }

  if (model === 'free') {
    return (
      <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <Sparkles size={12} /> Free
      </span>
    );
  }

  if (model === 'freemium') {
    return (
      <span className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Coins size={12} /> Freemium
      </span>
    );
  }
  
  return (
    <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <Coins size={12} /> {price && price > 0 ? `${price} credits` : 'Paid'}
    </span>
  );
}
