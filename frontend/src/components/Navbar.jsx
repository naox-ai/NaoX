import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Search, Menu, X, LayoutDashboard, Plus, LogOut, Network } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { WalletButton } from './WalletButton.jsx';
import logo from '../../public/assets/img/logo.png';

export function Navbar({ onSearch }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(search);
    } else {
      navigate(`/?q=${encodeURIComponent(search)}`);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logo} alt="AgentMesh" className="w-full h-full" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                Agent<span className="gradient-text">Mesh</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" label="Explore" />
              <NavLink to="/categories" label="Categories" />
              <NavLink to="/dashboard" label="Dashboard" />
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-6">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents, capabilities..."
                className="input pl-9 py-2 text-sm"
              />
            </form>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <WalletButton />
            {user ? (
              <>
                <Link to="/publish" className="btn-primary text-sm">
                  <Plus size={16} /> Publish
                </Link>
                <div className="relative group">
                  <button className="w-9 h-9 rounded-full bg-bg-elev border border-border flex items-center justify-center text-sm font-semibold text-gray-300 hover:border-border-hover transition-colors">
                    {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-52 card p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {profile?.full_name || profile?.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-bg-elev rounded-lg transition-colors">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-bg-elev rounded-lg transition-colors"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn-ghost text-sm">Sign in</Link>
                <Link to="/signup" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-300"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-3 animate-fade-in">
            <form onSubmit={handleSearch} className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents..."
                className="input pl-9 py-2 text-sm"
              />
            </form>
            <div className="flex flex-col gap-1">
              <Link to="/" className="px-3 py-2 text-sm text-gray-300 hover:bg-bg-elev rounded-lg">Explore</Link>
              <Link to="/categories" className="px-3 py-2 text-sm text-gray-300 hover:bg-bg-elev rounded-lg">Categories</Link>
              <Link to="/dashboard" className="px-3 py-2 text-sm text-gray-300 hover:bg-bg-elev rounded-lg">Dashboard</Link>
              <div className="pt-2">
                <WalletButton />
              </div>
              {user ? (
                <>
                  <Link to="/publish" className="btn-primary text-sm justify-center mt-2">
                    <Plus size={16} /> Publish Agent
                  </Link>
                  <button onClick={() => signOut()} className="btn-ghost text-sm justify-center mt-1">
                    <LogOut size={15} /> Sign out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Link to="/signin" className="btn-ghost text-sm flex-1 justify-center">Sign in</Link>
                  <Link to="/signup" className="btn-primary text-sm flex-1 justify-center">Get started</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ to, label }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active ? 'text-primary' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {label}
    </Link>
  );
}
