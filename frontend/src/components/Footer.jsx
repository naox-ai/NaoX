import { Network, Github, Twitter, Disc } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../public/assets/img/logo.png';

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src={logo} alt="AgentMesh" className="w-full h-full" />
              </div>
              <span className="font-bold">AgentMesh</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs">
              The decentralized marketplace for AI agents. Discover, deploy, and monetize intelligent agents with crypto payments.
            </p>
          </div>

          <FooterCol title="Platform" links={[
            { label: 'Explore', to: '/' },
            { label: 'Categories', to: '/categories' },
            { label: 'Publish', to: '/publish' },
            { label: 'Dashboard', to: '/dashboard' },
          ]} />

          <FooterCol title="Resources" links={[
            { label: 'Documentation', to: '/' },
            { label: 'API Reference', to: '/' },
            { label: 'Tutorials', to: '/' },
            { label: 'Blog', to: '/' },
          ]} />

          <FooterCol title="Company" links={[
            { label: 'About', to: '/' },
            { label: 'Privacy', to: '/' },
            { label: 'Terms', to: '/' },
            { label: 'Contact', to: '/' },
          ]} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-border">
          <p className="text-sm text-gray-500">© 2026 AgentMesh. Decentralized by design.</p>
          <div className="flex items-center gap-3">
            <a href="#" className="w-9 h-9 rounded-lg bg-bg-elev border border-border flex items-center justify-center text-gray-400 hover:text-primary hover:border-border-hover transition-colors">
              <Github size={16} />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-bg-elev border border-border flex items-center justify-center text-gray-400 hover:text-primary hover:border-border-hover transition-colors">
              <Twitter size={16} />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-bg-elev border border-border flex items-center justify-center text-gray-400 hover:text-primary hover:border-border-hover transition-colors">
              <Disc size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-300 mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-gray-500 hover:text-primary transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
