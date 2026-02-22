import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { LoadingSpinner, StatusBadge } from '../components/UI';
import { Swords, Target, Shield, MapPin, Calendar } from 'lucide-react';

export default function WarDetail() {
  const { id } = useParams<{ id: string }>();
  const [war, setWar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) api.wars.get(id).then(setWar).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!war) return <div className="text-center py-20 text-mc-gray">War not found</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/wars" className="text-mc-green text-sm hover:underline">&larr; Back to Wars</Link>

      <div className="mc-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Swords className="w-8 h-8 text-mc-red" />
            <div>
              <h1 className="text-2xl font-bold">{war.title}</h1>
              <p className="text-mc-gray text-sm">Declared by {war.attacker?.username}</p>
            </div>
          </div>
          <StatusBadge status={war.status} />
        </div>
        <p className="text-mc-gray">{war.reason}{war.reasonDetails ? ` — ${war.reasonDetails}` : ''}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-mc-gray">
          {war.noticeSentAt && (
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              Notice sent: {new Date(war.noticeSentAt).toLocaleString()}
            </span>
          )}
          {war.status === 'notice_sent' && war.noticeSentAt && (() => {
            const msLeft = new Date(war.noticeSentAt).getTime() + 86400000 - Date.now();
            const hLeft = Math.max(0, Math.ceil(msLeft / 3600000));
            return hLeft > 0 ? (
              <span className="text-mc-yellow font-semibold">⏳ {hLeft}h until combat begins</span>
            ) : (
              <span className="text-mc-red font-semibold">⚔️ Combat may now begin</span>
            );
          })()}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="mc-card">
        <div className="flex items-center gap-4 p-4">
          <div className="flex-1 text-center">
            <Target size={24} className="text-mc-red mx-auto mb-2" />
            <h3 className="text-xl font-bold text-mc-red">{war.attackingTown?.name}</h3>
            <div className="text-4xl font-bold text-mc-red mt-2">{war.attackerScore}</div>
            <div className="text-mc-gray text-sm">Victories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-mc-gray">VS</div>
          </div>
          <div className="flex-1 text-center">
            <Shield size={24} className="text-mc-blue mx-auto mb-2" />
            <h3 className="text-xl font-bold text-mc-blue">{war.defendingTown?.name}</h3>
            <div className="text-4xl font-bold text-mc-blue mt-2">{war.defenderScore}</div>
            <div className="text-mc-gray text-sm">Victories</div>
          </div>
        </div>
        {war.outcome && (
          <div className="text-center mt-4 pt-4 border-t border-mc-border">
            <span className="text-mc-gold font-bold">Outcome: </span>
            <StatusBadge status={war.outcome} />
          </div>
        )}
      </div>

      {/* Battle Timeline */}
      <div className="mc-card">
        <h2 className="flex items-center gap-2 font-bold mb-4">
          <Swords size={18} className="text-mc-gold" />
          Battle History ({war.battles?.length || 0})
        </h2>
        {(war.battles || []).length === 0 ? (
          <p className="text-mc-gray text-sm text-center py-4">No battles recorded yet</p>
        ) : (
          <div className="space-y-3">
            {war.battles.map((battle: any, i: number) => (
              <div key={battle.id} className="flex items-start gap-4 p-3 bg-mc-dark rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mc-border flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{battle.name}</h4>
                    {battle.victor && (
                      <span className={`text-xs font-bold ${battle.victor === 'attacker' ? 'text-mc-red' : 'text-mc-blue'}`}>
                        {battle.victor === 'attacker' ? '🗡 Attacker Won' : '🛡 Defender Won'}
                      </span>
                    )}
                  </div>
                  {battle.description && <p className="text-mc-gray text-sm mt-1">{battle.description}</p>}
                  {(battle.arsonCommitted || battle.residentialDamage || battle.farmDamage) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {battle.arsonCommitted && <span className="text-xs bg-mc-red/10 text-mc-red px-1 rounded">🔥 Arson</span>}
                      {battle.residentialDamage && <span className="text-xs bg-mc-red/10 text-mc-red px-1 rounded">🏠 Residential Damage</span>}
                      {battle.farmDamage && <span className="text-xs bg-mc-red/10 text-mc-red px-1 rounded">🌾 Farm Damage</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-mc-gray">
                    {battle.location && (
                      <span className="flex items-center gap-1"><MapPin size={10} /> {battle.location}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {new Date(battle.foughtAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
