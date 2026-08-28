import { Star } from 'lucide-react';

export function RatingStars({ value, size = 14, showValue = false, count }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= rounded ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-sm text-gray-400">
          {value > 0 ? value.toFixed(1) : 'New'}
          {count !== undefined && count > 0 && ` (${count})`}
        </span>
      )}
    </span>
  );
} 
