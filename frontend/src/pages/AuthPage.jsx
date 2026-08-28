import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Network, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export function AuthPage({ mode }) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp) {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim(), fullName.trim());
      if (error) setError(error);
      else navigate(from);
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
      else navigate(from);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="glow-orb w-96 h-96 bg-primary top-[-100px] left-[-100px] animate-pulse-glow" />
      <div className="glow-orb w-96 h-96 bg-accent bottom-[-100px] right-[-100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Network size={22} className="text-bg" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl">AgentMesh</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-center mb-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            {isSignUp ? 'Join the decentralized AI agent marketplace' : 'Sign in to your AgentMesh account'}
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="agentcreator"
                    className="input"
                    required
                    minLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Full name <span className="text-gray-600">(optional)</span></label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="input"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-9"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-5">
            {isSignUp ? (
              <>Already have an account? <Link to="/signin" className="text-primary hover:underline">Sign in</Link></>
            ) : (
              <>Don&apos;t have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
