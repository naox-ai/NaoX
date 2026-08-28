import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { AgentCard } from '../components/AgentCard.jsx';
import { Plus, LayoutGrid, Rocket, Loader2, Trash2, Pause, Play, TrendingUp, Star, Cpu, Bitcoin } from 'lucide-react';

export function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('published');
  const [myAgents, setMyAgents] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [deployedAgents, setDeployedAgents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [agentsRes, depsRes, payRes] = await Promise.all([
      supabase
        .from('agents')
        .select('*, category:categories(*), creator:profiles!agents_creator_id_fkey(*)')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('deployments')
        .select('*, agent:agents(*, category:categories(*), creator:profiles!agents_creator_id_fkey(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('payments')
        .select('*, agent:agents(name, slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    setMyAgents(agentsRes.data ?? []);
    setDeployments(depsRes.data ?? []);
    setDeployedAgents(
      (depsRes.data ?? [])
        .map((d) => d.agent)
        .filter(Boolean)
    );
    setPayments(payRes.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin', { state: { from: '/dashboard' } });
      return;
    }
    loadData();
  }, [authLoading, user, navigate, loadData]);

  const toggleDeployment = async (dep) => {
    const newStatus = dep.status === 'active' ? 'paused' : 'active';
    await supabase.from('deployments').update({ status: newStatus }).eq('id', dep.id);
    loadData();
  };

  const removeDeployment = async (dep) => {
    await supabase.from('deployments').delete().eq('id', dep.id);
    loadData();
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const totalRuns = myAgents.reduce((s, a) => s + a.runs_count, 0);
  const totalRating = myAgents.filter((a) => a.rating_count > 0).length;
  const avgRating = myAgents.length > 0
    ? myAgents.filter((a) => a.rating_count > 0).reduce((s, a) => s + a.rating_avg, 0) / (totalRating || 1)
    : 0;
  const totalCryptoEarned = payments
    .filter((p) => p.status === 'confirmed')
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-500">Welcome back, @{profile?.username}</p>
        </div>
        <Link to="/publish" className="btn-primary">
          <Plus size={16} /> Publish new agent
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<LayoutGrid size={18} />} label="Published agents" value={myAgents.filter((a) => a.status === 'published').length} />
        <StatCard icon={<Rocket size={18} />} label="Deployed agents" value={deployments.length} />
        <StatCard icon={<TrendingUp size={18} />} label="Total runs" value={totalRuns} />
        <StatCard icon={<Star size={18} />} label="Avg rating" value={avgRating > 0 ? avgRating.toFixed(1) : '—'} />
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-border overflow-x-auto">
        <TabButton active={tab === 'published'} onClick={() => setTab('published')} icon={<LayoutGrid size={16} />} label="My Agents" count={myAgents.length} />
        <TabButton active={tab === 'deployed'} onClick={() => setTab('deployed')} icon={<Rocket size={16} />} label="Deployed" count={deployments.length} />
        <TabButton active={tab === 'payments'} onClick={() => setTab('payments')} icon={<Bitcoin size={16} />} label="Payments" count={payments.length} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : tab === 'published' ? (
        myAgents.length === 0 ? (
          <EmptyState
            title="No agents yet"
            description="Publish your first AI agent to get started on the marketplace."
            action={<Link to="/publish" className="btn-primary"><Plus size={16} /> Publish agent</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {myAgents.map((a) => (
              <div key={a.id} className="relative">
                <AgentCard agent={a} />
                {a.status === 'draft' && (
                  <span className="absolute top-3 right-3 badge bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Draft</span>
                )}
              </div>
            ))}
          </div>
        )
      ) : tab === 'deployed' ? (
        deployments.length === 0 ? (
          <EmptyState
            title="No deployments yet"
            description="Deploy agents from the marketplace to see them here."
            action={<Link to="/" className="btn-primary">Explore marketplace</Link>}
          />
        ) : (
          <div className="space-y-3">
            {deployments.map((dep) => {
              const agent = deployedAgents.find((a) => a.id === dep.agent_id);
              if (!agent) return null;
              return (
                <div key={dep.id} className="card p-4 flex items-center gap-4">
                  <Link to={`/agent/${agent.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${hashHue(agent.name)}, 70%, 25%), hsl(${(hashHue(agent.name) + 40) % 360}, 70%, 18%))`,
                        color: `hsl(${hashHue(agent.name)}, 80%, 75%)`,
                      }}
                    >
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-200 truncate">{agent.name}</p>
                      <p className="text-xs text-gray-500">
                        Deployed {new Date(dep.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${dep.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                      <Cpu size={11} /> {dep.status}
                    </span>
                    <button onClick={() => toggleDeployment(dep)} className="p-2 text-gray-400 hover:text-primary transition-colors" title={dep.status === 'active' ? 'Pause' : 'Resume'}>
                      {dep.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button onClick={() => removeDeployment(dep)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Remove">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Payments tab */
        payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Pay for Web3 agent runs with crypto to see transactions here."
            action={<Link to="/" className="btn-primary">Explore marketplace</Link>}
          />
        ) : (
          <div className="space-y-3">
            {totalCryptoEarned > 0 && (
              <div className="card p-4 flex items-center gap-3 mb-4">
                <Bitcoin size={20} className="text-violet-400" />
                <div>
                  <p className="text-sm text-gray-500">Total crypto spent</p>
                  <p className="text-xl font-bold text-gray-100">{totalCryptoEarned.toFixed(4)} (across tokens)</p>
                </div>
              </div>
            )}
            {payments.map((p) => (
              <div key={p.id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Bitcoin size={18} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/agent/${p.agent?.slug}`} className="font-medium text-gray-200 hover:text-primary truncate block">
                    {p.agent?.name || 'Unknown agent'}
                  </Link>
                  <p className="text-xs text-gray-500 font-mono truncate">
                    {p.tx_hash ? `${p.tx_hash.slice(0, 18)}...` : 'No tx hash'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-100">{p.amount} {p.token_symbol}</p>
                  <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`badge ${p.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
        active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'
      }`}
    >
      {icon} {label}
      <span className="text-xs text-gray-600">({count})</span>
    </button>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="card p-12 text-center">
      <p className="text-gray-300 font-medium mb-1">{title}</p>
      <p className="text-sm text-gray-500 mb-5">{description}</p>
      {action}
    </div>
  );
}

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}
