import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { AgentCard } from '../components/AgentCard.jsx';
import { Filter, SlidersHorizontal, TrendingUp, Sparkles, Clock, Star, Globe, Bitcoin } from 'lucide-react';

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('cat') ?? null);
  const [sort, setSort] = useState('trending');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [web3Only, setWeb3Only] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('agents')
      .select('*, category:categories(*), creator:profiles!agents_creator_id_fkey(*)')
      .eq('status', 'published');

    if (activeCategory) {
      const cat = categories.find((c) => c.slug === activeCategory);
      if (cat) q = q.eq('category_id', cat.id);
    }

    if (web3Only) {
      q = q.eq('is_web3', true);
    }

    if (query.trim()) {
      q = q.or(`name.ilike.%${query}%,tagline.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (sort === 'newest') q = q.order('created_at', { ascending: false });
    else if (sort === 'top_rated') q = q.order('rating_avg', { ascending: false }).order('rating_count', { ascending: false });
    else q = q.order('runs_count', { ascending: false });

    const { data, error } = await q.limit(48);
    if (error) {
      console.error('fetchAgents error:', error.message);
    }
    setAgents(data ?? []);
    setLoading(false);
  }, [activeCategory, sort, query, categories, web3Only]);

  useEffect(() => {
    const t = setTimeout(fetchAgents, 150);
    return () => clearTimeout(t);
  }, [fetchAgents]);

  const handleSearch = (q) => {
    setQuery(q);
    setSearchParams(q ? { q } : {});
  };

  return (
    <div>
      <Hero onSearch={handleSearch} initialQuery={query} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 shrink-0">
            <div className="card p-4 sticky top-20">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-300">
                <Filter size={15} /> Filters
              </div>

              <button
                onClick={() => setWeb3Only(!web3Only)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-2 transition-colors ${
                  web3Only
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-bg-elev border border-transparent'
                }`}
              >
                <Bitcoin size={14} /> Web3 Agents only
              </button>

              <div className="flex items-center gap-2 mb-2 mt-3 text-sm font-semibold text-gray-300">
                <Globe size={15} /> Categories
              </div>
              <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
                <CategoryChip
                  label="All"
                  active={activeCategory === null}
                  onClick={() => setActiveCategory(null)}
                />
                {categories.map((c) => (
                  <CategoryChip
                    key={c.id}
                    label={c.name}
                    active={activeCategory === c.slug}
                    onClick={() => setActiveCategory(c.slug)}
                  />
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-200">
                {activeCategory
                  ? categories.find((c) => c.slug === activeCategory)?.name
                  : web3Only ? 'Web3 Agents' : 'All Agents'}
                <span className="text-gray-500 font-normal ml-2">({agents.length})</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal size={15} className="text-gray-500" />
                <SortButton sort={sort} onChange={setSort} />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-5 h-56 animate-pulse">
                    <div className="flex gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-bg-elev" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-bg-elev rounded w-3/4" />
                        <div className="h-3 bg-bg-elev rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-3 bg-bg-elev rounded mb-2" />
                    <div className="h-3 bg-bg-elev rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : agents.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-gray-400 mb-1">No agents found</p>
                <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
                {agents.map((a) => (
                  <AgentCard key={a.id} agent={a} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ onSearch, initialQuery }) {
  const [local, setLocal] = useState(initialQuery);

  useEffect(() => setLocal(initialQuery), [initialQuery]);

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="glow-orb w-96 h-96 bg-primary top-[-100px] left-[-100px] animate-pulse-glow" />
      <div className="glow-orb w-96 h-96 bg-accent top-[-50px] right-[-100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 badge bg-primary/10 text-primary border border-primary/20 mb-6">
          <Sparkles size={13} /> Decentralized AI Agent Network
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-5 max-w-3xl mx-auto">
          Discover, deploy & monetize
          <br />
          <span className="gradient-text">autonomous AI agents</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          A permissionless marketplace where creators publish AI agents and users deploy them with crypto payments. No middlemen, no gatekeepers, on-chain by design.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); onSearch(local); }}
          className="max-w-xl mx-auto relative"
        >
          <input
            type="text"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Search for agents, capabilities, or creators..."
            className="input pl-12 pr-4 py-3.5 text-base"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-10 text-sm text-gray-500">
          <Stat icon={<TrendingUp size={15} />} label="Verified agents" />
          <Stat icon={<Bitcoin size={15} />} label="Crypto payments" />
          <Stat icon={<Star size={15} />} label="Community rated" />
          <Stat icon={<Clock size={15} />} label="24/7 uptime" />
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-primary">{icon}</span> {label}
    </span>
  );
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-left ${
        active
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-gray-400 hover:text-gray-200 hover:bg-bg-elev border border-transparent'
      }`}
    >
      {label}
    </button>
  );
}

function SortButton({ sort, onChange }) {
  const labels = {
    trending: 'Trending',
    newest: 'Newest',
    top_rated: 'Top rated',
  };
  const order = ['trending', 'newest', 'top_rated'];
  const next = order[(order.indexOf(sort) + 1) % order.length];
  return (
    <button onClick={() => onChange(next)} className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
      {labels[sort]}
    </button>
  );
}
