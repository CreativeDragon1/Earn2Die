import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner, StatusBadge } from '../components/UI';
import { Castle, Users, MapPin, Crown, Shield, ShieldOff, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function TownDetail() {
  const { id } = useParams<{ id: string }>();
  const { player, isAuthenticated } = useAuth();
  const [town, setTown] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.towns.get(id).then(setTown).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!town) return <div className="text-center py-20 text-mc-gray">Town not found</div>;

  const isMember = town.members?.some((m: any) => m.playerId === player?.id);
  const isAdmin = player?.role === 'admin';

  const allAlliances = [
    ...(town.alliances1 || []).map((a: any) => ({ ...a, ally: a.town2 })),
    ...(town.alliances2 || []).map((a: any) => ({ ...a, ally: a.town1 })),
  ];

  const roleColors: Record<string, string> = {
    leader: 'text-mc-gold',
    general: 'text-mc-red',
    minister: 'text-mc-purple',
    officer: 'text-mc-blue',
    citizen: 'text-mc-gray',
  };

  const requirements = [
    { label: 'Stone perimeter wall built', met: town.hasWall },
    { label: 'Dirt path to another town', met: town.hasPathConnection },
    { label: 'Constitution (book & quill) placed', met: town.hasConstitution },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/towns" className="text-mc-green text-sm hover:underline">&larr; Back to Towns</Link>

      {/* Header */}
      <div className="mc-card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Castle className="w-8 h-8 text-mc-gold" />
              <h1 className="text-2xl font-bold">{town.name}</h1>
              <StatusBadge status={town.type} />
              {town.status === 'pending_approval' && (
                <span className="flex items-center gap-1 text-xs text-mc-gold bg-mc-gold/10 px-2 py-1 rounded">
                  <Clock size={10} /> Pending Approval
                </span>
              )}
            </div>
            {town.motto && <p className="text-mc-gray italic">"{town.motto}"</p>}
            {town.description && <p className="text-mc-gray mt-2">{town.description}</p>}
            {town.coordinates && (
              <p className="text-mc-gray text-xs mt-1 flex items-center gap-1">
                <MapPin size={10} /> {town.coordinates}
              </p>
            )}
          </div>
          <div>
            {town.protectionStatus
              ? <span className="flex items-center gap-2 text-mc-green font-semibold"><Shield size={18} /> Protected</span>
              : <span className="flex items-center gap-2 text-mc-red font-semibold"><ShieldOff size={18} /> Unprotected</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-mc-border">
          {[
            { label: 'Population', value: town.population, icon: Users, color: 'text-mc-green' },
            { label: 'Territory', value: `${town.territory} chunks`, icon: MapPin, color: 'text-mc-blue' },
            { label: 'Level', value: town.level, icon: Shield, color: 'text-mc-aqua' },
            { label: 'Treasury', value: `⛃ ${town.treasury.toLocaleString()}`, icon: Crown, color: 'text-mc-gold' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center">
              <Icon size={18} className={`${color} mx-auto mb-1`} />
              <div className={`font-bold ${color}`}>{value}</div>
              <div className="text-mc-gray text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Permanent membership notice */}
        {isAuthenticated && isMember && (
          <div className="mt-4 p-3 bg-mc-green/10 border border-mc-green/30 rounded-lg text-mc-green text-sm">
            You are a permanent member of this town. Town membership in Earn2Die is for life — you cannot leave or join another town.
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Members */}
        <div className="mc-card lg:col-span-2">
          <h2 className="flex items-center gap-2 font-bold mb-4">
            <Users size={18} className="text-mc-green" />
            Members ({town.members?.length || 0})
          </h2>
          <div className="space-y-2">
            {(town.members || []).map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-mc-dark rounded-lg">
                <div className="flex items-center gap-2">
                  {member.role === 'leader' && <Crown size={14} className="text-mc-gold" />}
                  <span className="font-medium">{member.player?.username}</span>
                </div>
                <span className={`text-xs font-medium ${roleColors[member.role] || 'text-mc-gray'}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Protection Requirements */}
        <div className="mc-card">
          <h2 className="flex items-center gap-2 font-bold mb-4">
            <Shield size={18} className="text-mc-aqua" />
            Protection Checklist
          </h2>
          <div className="space-y-3">
            {requirements.map((r) => (
              <div key={r.label} className="flex items-center gap-3 text-sm">
                {r.met
                  ? <CheckCircle size={16} className="text-mc-green shrink-0" />
                  : <XCircle size={16} className="text-mc-red shrink-0" />}
                <span className={r.met ? 'text-white' : 'text-mc-gray'}>{r.label}</span>
              </div>
            ))}
          </div>
          {!town.protectionStatus && (
            <p className="text-mc-red text-xs mt-4">Without protection status, griefing your town breaches no rules.</p>
          )}
        </div>
      </div>

      {/* Alliances */}
      {allAlliances.length > 0 && (
        <div className="mc-card">
          <h2 className="flex items-center gap-2 font-bold mb-4">
            <Shield size={18} className="text-mc-blue" />
            Alliances ({allAlliances.length})
          </h2>
          <div className="space-y-2">
            {allAlliances.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-mc-dark rounded-lg">
                <div>
                  <span className="font-medium">{a.name}</span>
                  <span className="text-mc-gray text-xs ml-2">with {a.ally?.name}</span>
                </div>
                <StatusBadge status={a.type} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
