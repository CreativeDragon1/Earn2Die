import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { LoadingSpinner, StatusBadge } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import {
  Castle, Swords, Eye, ShoppingBag, Scale, Users,
  TrendingUp, Shield, Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const { isAuthenticated, player } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentWars, setRecentWars] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.players.stats().catch(() => null),
      api.wars.list().catch(() => []),
      api.trade.list().catch(() => []),
    ]).then(([s, w, t]) => {
      setStats(s);
      setRecentWars((w || []).slice(0, 3));
      setRecentTrades((t || []).slice(0, 4));
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner text="Loading server data..." />;

  const statCards = [
    { label: 'Players Online', value: stats?.playerCount ?? 0, icon: Users, color: 'text-mc-green', bg: 'bg-mc-green/10' },
    { label: 'Active Towns', value: stats?.townCount ?? 0, icon: Castle, color: 'text-mc-gold', bg: 'bg-mc-gold/10' },
    { label: 'Active Wars', value: stats?.activeWars ?? 0, icon: Swords, color: 'text-mc-red', bg: 'bg-mc-red/10' },
    { label: 'Trade Listings', value: stats?.activeTrades ?? 0, icon: ShoppingBag, color: 'text-mc-aqua', bg: 'bg-mc-aqua/10' },
    { label: 'Open Cases', value: stats?.openCases ?? 0, icon: Scale, color: 'text-mc-purple', bg: 'bg-mc-purple/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-10 h-10 text-mc-green animate-float" />
          <h1 className="mc-heading text-2xl text-mc-green">Earn2Die</h1>
          <Sparkles className="w-10 h-10 text-mc-gold animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <p className="text-mc-gray text-lg max-w-2xl mx-auto">
          Build empires, forge alliances, wage wars, trade goods, and uphold justice
          on the Earn2Die civilization server.
        </p>
        {isAuthenticated && player && (
          <div className="mt-4 inline-flex items-center gap-2 bg-mc-card border border-mc-border rounded-full px-4 py-2">
            <span className="text-mc-gray">Welcome back,</span>
            <span className="text-mc-gold font-bold">{player.username}</span>
            <TrendingUp size={14} className="text-mc-green" />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="mc-card text-center">
            <div className={`inline-flex p-3 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-mc-gray text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {isAuthenticated && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { to: '/towns', label: 'Towns', icon: Castle, color: 'mc-btn-gold' },
            { to: '/wars', label: 'Wars', icon: Swords, color: 'mc-btn-danger' },
            { to: '/espionage', label: 'Espionage', icon: Eye, color: 'mc-btn-blue' },
            { to: '/trade', label: 'Trade', icon: ShoppingBag, color: 'mc-btn-primary' },
            { to: '/legal', label: 'Legal', icon: Scale, color: 'mc-btn-gold' },
          ].map(({ to, label, icon: Icon, color }) => (
            <Link key={to} to={to} className={`${color} flex items-center justify-center gap-2 py-3 text-sm`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Wars */}
        <div className="mc-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-bold">
              <Swords size={18} className="text-mc-red" />
              Active Conflicts
            </h2>
            <Link to="/wars" className="text-mc-green text-sm hover:underline">View all</Link>
          </div>
          {recentWars.length === 0 ? (
            <p className="text-mc-gray text-sm py-4 text-center">Peace prevails... for now.</p>
          ) : (
            <div className="space-y-3">
              {recentWars.map((war: any) => (
                <Link key={war.id} to={`/wars/${war.id}`} className="block p-3 bg-mc-dark rounded-lg hover:bg-mc-dark/80 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{war.title}</span>
                    <StatusBadge status={war.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-mc-gray">
                    <span className="text-mc-red">{war.attackingTown?.name}</span>
                    <span>vs</span>
                    <span className="text-mc-blue">{war.defendingTown?.name}</span>
                    <span className="ml-auto">{war.attackerScore} - {war.defenderScore}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Trade */}
        <div className="mc-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-bold">
              <ShoppingBag size={18} className="text-mc-aqua" />
              Marketplace
            </h2>
            <Link to="/trade" className="text-mc-green text-sm hover:underline">View all</Link>
          </div>
          {recentTrades.length === 0 ? (
            <p className="text-mc-gray text-sm py-4 text-center">No items listed yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-mc-dark rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{item.itemName}</div>
                    <div className="text-mc-gray text-xs">by {item.seller?.username} &bull; Qty: {item.quantity}</div>
                  </div>
                  <div className="text-mc-gold font-bold">⛃ {item.price}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
