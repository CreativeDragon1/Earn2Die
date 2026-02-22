import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge, Skeleton } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import {
  Castle, Swords, Eye, ShoppingBag, Scale, Users,
  TrendingUp, Shield, Sparkles, BookOpen, Scroll, Gavel, Megaphone
} from 'lucide-react';

const SERVER_INTRO = `Welcome to Earn2Die — a Minecraft civilization roleplay server where you build towns, forge alliances, declare wars, trade resources, and uphold justice. Every action has consequences. Every town tells a story.`;

const INFO_TABS = [
  {
    id: 'roleplay-info',
    label: 'Roleplay Info',
    icon: BookOpen,
    color: 'text-mc-green',
    sections: [
      {
        title: 'Towns',
        content: [
          'To start a town, you need at least 5 members.',
          'Notify a server admin to start a town — provide a list of members and town coordinates.',
          'Once approved, a 150×150 plot is allocated. Each new registered member adds a 50×50 extension.',
          'A stone wall must be built around the perimeter to mark town boundaries.',
          'Every town must have at least one direct dirt path connection to another town (for trade).',
          'Each town must write a constitution on a book & quill — one copy kept inside the town, one on a lectern at the entrance.',
          'Each new member must be registered with the admin.',
          'Town laws can be anything; no restrictions — but server laws always override town laws.',
          'If a visitor breaks town law, the town leader is responsible for capturing and prosecuting the perpetrator via trial.',
          'Any infrastructure built outside town walls has no protection status and cannot have legal action taken if griefed.',
          'A town only gains protection status once all procedures are complete. Without it, griefing the town breaks no rules.',
        ],
      },
      {
        title: 'War',
        content: [
          'A formal declaration must be sent to the target town at least 24 hours before any hostile action.',
          'Valid war reasons (usable in trial): suspicion of harbouring enemies, invasion for resources, revenge for espionage, or other justified reasons.',
          'Towns cannot deal more damage than necessary.',
          'ALLOWED targets: defence infrastructure (walls, traps), military infrastructure (weapons storage, outposts), town inventory.',
          'PROHIBITED: arson on residential buildings, destroying homes, destroying farms (crops may be taken, infrastructure cannot), destroying decorations.',
          'Victims may take legal action for war crimes.',
        ],
      },
      {
        title: 'Espionage',
        content: [
          'Paying town members to reveal secrets (loot locations, defence strength).',
          'Disguising a player to infiltrate the target town as a member to sabotage or uncover secrets.',
        ],
      },
      {
        title: 'Trade',
        content: [
          'Any individual or town can open a store.',
          'Stores cannot be griefed or stolen from — perpetrators face trial.',
          'Store owners set their preferred currency and exchange rate.',
          'Barter is allowed: resources can be traded for other resources at any ratio.',
        ],
      },
    ],
  },
  {
    id: 'roleplay-law',
    label: 'Roleplay Law',
    icon: Scroll,
    color: 'text-mc-gold',
    sections: [
      {
        title: 'Trials',
        content: ['All trials take place at the courthouse near spawn.'],
      },
      {
        title: 'Town Law Trials',
        content: [
          'Any constitutional town law that is broken is handled via trial.',
          'The townspeople are the plaintiff; the accused is the defendant.',
          'The server admin acts as judge; anyone from other towns may apply to be a jury member.',
        ],
      },
      {
        title: 'War Law Trials',
        content: [
          'The attacked town is the plaintiff; the attackers are the defendant.',
          'The server admin acts as judge; anyone not affected by the conflict may apply to be a jury member.',
          'Any war crimes (see Roleplay Info → War) can be presented to the judge.',
          'If the plaintiff wins: the defendant must pay compensation as specified by the judge. Suspension or regulation of military activity may also be ordered.',
        ],
      },
      {
        title: 'Trade Law Trials',
        content: [
          'The store owner or loss bearer is the plaintiff; the accused is the defendant.',
          'The server admin acts as judge; anyone may apply as jury — but members of the defendant\'s or plaintiff\'s town are inadmissible.',
          'Robbery — 1st Offence: defendant pays value of goods taken + 10% to plaintiff.',
          'Robbery — 2nd Offence: defendant pays value of goods taken + 50%, and/or banned from trading for 15 days; jailed for 2 in-game days.',
          'Robbery — 3rd Offence: defendant pays double the value of goods taken; punishment decided internally — options include exile from town or jail for jury-determined duration.',
        ],
      },
      {
        title: 'Bounties',
        content: ['Bounty system details coming soon.'],
      },
    ],
  },
  {
    id: 'server-law',
    label: 'Server Law',
    icon: Gavel,
    color: 'text-mc-red',
    sections: [
      {
        title: 'Rules',
        content: [
          'No spawn trapping.',
          '15,000 × 15,000 block world border.',
          'Town destruction, griefing, and looting are NOT allowed unless war has been formally declared between the two towns.',
          'Total base destruction is prohibited.',
          'The End is disabled.',
          'No mass TNT machines that cause lag (cannons are permitted).',
          'PvP is allowed in non-civilised areas (outside all town walls).',
          'Strictly no lag machines.',
          'X-ray and combat hacks are prohibited.',
          'No entity cramming — maximum 1 animal per 2 blocks.',
          'ANYTHING outside town walls can be destroyed, and anyone outside town walls can be killed without consequence.',
          'Underground bases (including cave bases) are STRICTLY prohibited. All respawn points must be on ground level.',
          'No mob/XP farms — grinding is expected to maintain the spirit of the roleplay.',
        ],
      },
      {
        title: 'Penalties',
        content: [
          '1st offence: verbal warning.',
          '2nd offence: final warning.',
          '3rd offence: ban.',
        ],
      },
    ],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: Megaphone,
    color: 'text-mc-aqua',
    sections: [
      {
        title: 'Latest',
        content: ['No announcements yet. Check back soon.'],
      },
    ],
  },
];

export default function Dashboard() {
  const { isAuthenticated, player } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentWars, setRecentWars] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roleplay-info');

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

  // No full-page block — render immediately, skeletons fill in
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

      {/* Server Info Tabs */}
      <div className="mc-card">
        <p className="text-mc-gray text-sm text-center mb-6 max-w-2xl mx-auto leading-relaxed">{SERVER_INTRO}</p>
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {INFO_TABS.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? `bg-mc-dark border border-mc-border ${color}`
                  : 'text-mc-gray hover:text-white hover:bg-mc-dark/50'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        {INFO_TABS.filter(t => t.id === activeTab).map(tab => (
          <div key={tab.id} className="space-y-6">
            {tab.sections.map(section => (
              <div key={section.title}>
                <h3 className={`font-bold mb-3 flex items-center gap-2 ${tab.color}`}>
                  <span className="w-1 h-4 rounded bg-current inline-block" />
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.content.map((line, i) => (
                    <li key={i} className="flex gap-2 text-sm text-mc-gray leading-relaxed">
                      <span className="text-mc-border mt-1.5 shrink-0">▸</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mc-card text-center space-y-3">
                <Skeleton className="w-12 h-12 rounded-lg mx-auto" />
                <Skeleton className="h-7 w-10 mx-auto" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
            ))
          : statCards.map(({ label, value, icon: Icon, color, bg }) => (
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
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : recentWars.length === 0 ? (
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
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : recentTrades.length === 0 ? (
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
