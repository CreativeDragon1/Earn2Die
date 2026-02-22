import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Swords, Castle, Scroll, Eye, ShoppingBag, Scale, Home,
  LogOut, User, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/towns', label: 'Towns', icon: Castle },
  { path: '/wars', label: 'Wars', icon: Swords },
  { path: '/espionage', label: 'Espionage', icon: Eye },
  { path: '/trade', label: 'Trade', icon: ShoppingBag },
  { path: '/legal', label: 'Legal', icon: Scale },
];

export default function Layout() {
  const { player, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="bg-mc-dark border-b border-mc-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 text-mc-gray hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link to="/" className="flex items-center gap-2">
                <Swords className="w-6 h-6 text-mc-green" />
                <span className="mc-heading text-mc-green hidden sm:inline">Earn2Die</span>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${location.pathname === path
                      ? 'bg-mc-green/10 text-mc-green'
                      : 'text-mc-gray hover:text-white hover:bg-mc-card'
                    }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-sm">
                    <User size={14} className="text-mc-gold" />
                    <span className="text-mc-gold font-medium">{player?.username}</span>
                    {player?.balance !== undefined && (
                      <span className="text-mc-yellow ml-1">⛃ {player.balance.toLocaleString()}</span>
                    )}
                  </div>
                  <button onClick={logout} className="p-2 text-mc-gray hover:text-mc-red transition-colors" title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="mc-btn-primary text-sm">Login</Link>
                  <Link to="/register" className="mc-btn-gold text-sm hidden sm:inline-flex">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-mc-dark border-b border-mc-border animate-slide-up">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${location.pathname === path
                    ? 'bg-mc-green/10 text-mc-green'
                    : 'text-mc-gray hover:text-white hover:bg-mc-card'
                  }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-mc-dark border-t border-mc-border py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-mc-gray text-sm">
            <Swords className="inline w-4 h-4 mr-1 text-mc-green" />
            Earn2Die &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
