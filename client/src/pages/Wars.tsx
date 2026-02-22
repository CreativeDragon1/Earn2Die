import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner, StatusBadge, Modal, EmptyState } from '../components/UI';
import { Swords, Plus, Target, Shield, Clock } from 'lucide-react';

const WAR_REASONS = [
  { value: 'harboring_enemies', label: 'Harbouring enemies of the state' },
  { value: 'resource_invasion', label: 'Invasion for resources' },
  { value: 'espionage_revenge', label: 'Revenge for espionage' },
  { value: 'other_revenge', label: 'Revenge for other reasons' },
  { value: 'other', label: 'Other (describe below)' },
];

export default function Wars() {
  const { isAuthenticated, player } = useAuth();
  const [wars, setWars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showDeclare, setShowDeclare] = useState(false);
  const [myTowns, setMyTowns] = useState<any[]>([]);
  const [allTowns, setAllTowns] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', reason: 'harboring_enemies', reasonDetails: '', attackingTownId: '', defendingTownId: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.wars.list(filter || undefined).then(setWars).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  const openDeclare = async () => {
    try {
      const t = await api.towns.list();
      setAllTowns(t);
      setMyTowns(t.filter((town: any) => town.ownerId === player?.id));
      setShowDeclare(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclare = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await api.wars.declare(form);
      setWars([res.war ?? res, ...wars]);
      setShowDeclare(false);
      setForm({ title: '', reason: 'harboring_enemies', reasonDetails: '', attackingTownId: '', defendingTownId: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading conflicts..." />;

  const filters = ['', 'notice_sent', 'active', 'ceasefire', 'ended'];

  const noticeSentCountdown = (noticeSentAt: string) => {
    const elapsed = (Date.now() - new Date(noticeSentAt).getTime()) / (1000 * 60 * 60);
    if (elapsed >= 24) return null;
    const remaining = Math.ceil(24 - elapsed);
    return `${remaining}h until combat can begin`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Swords className="w-8 h-8 text-mc-red" />
          <div>
            <h1 className="text-2xl font-bold">Wars & Conflicts</h1>
            <p className="text-mc-gray text-sm">{wars.length} conflicts recorded</p>
          </div>
        </div>
        {isAuthenticated && (
          <button onClick={openDeclare} className="mc-btn-danger flex items-center gap-2">
            <Plus size={16} /> Send War Notice
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${filter === f ? 'bg-mc-red/20 text-mc-red border border-mc-red/30' : 'bg-mc-card text-mc-gray hover:text-white border border-mc-border'}`}
          >
            {f === 'notice_sent' ? 'Notice Sent' : f || 'All'}
          </button>
        ))}
      </div>

      {wars.length === 0 ? (
        <EmptyState icon={Swords} title="No wars found" description="The realm is at peace... or is it?" />
      ) : (
        <div className="space-y-4">
          {wars.map((war) => {
            const countdown = war.status === 'notice_sent' ? noticeSentCountdown(war.noticeSentAt) : null;
            return (
              <Link key={war.id} to={`/wars/${war.id}`} className="mc-card block group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-mc-red transition-colors">{war.title}</h3>
                    <p className="text-mc-gray text-sm mt-1">
                      {WAR_REASONS.find(r => r.value === war.reason)?.label ?? war.reason}
                    </p>
                    {countdown && (
                      <p className="flex items-center gap-1 text-mc-gold text-xs mt-1">
                        <Clock size={10} /> {countdown}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={war.status} />
                </div>

                <div className="flex items-center gap-4 p-3 bg-mc-dark rounded-lg">
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Target size={14} className="text-mc-red" />
                      <span className="font-semibold text-mc-red">{war.attackingTown?.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-mc-red">{war.attackerScore}</div>
                  </div>
                  <div className="text-mc-gray font-bold text-lg">VS</div>
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Shield size={14} className="text-mc-blue" />
                      <span className="font-semibold text-mc-blue">{war.defendingTown?.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-mc-blue">{war.defenderScore}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-mc-gray">
                  <span>Declared by {war.attacker?.username}</span>
                  <span>{war._count?.battles || 0} battles</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Declare War Modal */}
      <Modal open={showDeclare} onClose={() => setShowDeclare(false)} title="Send Formal War Notice">
        <form onSubmit={handleDeclare} className="space-y-4">
          {error && <div className="p-3 bg-mc-red/10 border border-mc-red/30 rounded-lg text-mc-red text-sm">{error}</div>}

          <div className="p-3 bg-mc-dark/50 rounded-lg text-mc-gray text-xs space-y-1">
            <p className="font-semibold text-mc-gold mb-1">⚔ Server War Rules</p>
            <p>• A formal notice must be given at least <strong className="text-white">24 hours</strong> before combat begins.</p>
            <p>• Only <strong className="text-white">defence infrastructure, military infra, and town inventory</strong> may be targeted.</p>
            <p>• <strong className="text-mc-red">Arson on homes, destroying farms/crops infrastructure, and attacking residential buildings are war crimes.</strong></p>
            <p>• Victims of war crimes may file a legal case.</p>
          </div>

          <div>
            <label className="block text-sm text-mc-gray mb-1">War Title *</label>
            <input className="mc-input" required
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Name this conflict" />
          </div>
          <div>
            <label className="block text-sm text-mc-gray mb-1">Casus Belli (Justification) *</label>
            <select className="mc-input" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
              {WAR_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <p className="text-mc-gray text-xs mt-1">This reason may be used in trial as justification for acts of war.</p>
          </div>
          {(form.reason === 'other_revenge' || form.reason === 'other') && (
            <div>
              <label className="block text-sm text-mc-gray mb-1">Details *</label>
              <textarea className="mc-input" rows={2} required
                value={form.reasonDetails} onChange={(e) => setForm({ ...form, reasonDetails: e.target.value })} placeholder="Describe the reason..." />
            </div>
          )}
          <div>
            <label className="block text-sm text-mc-gray mb-1">Your Town (Attacker) *</label>
            <select className="mc-input" required value={form.attackingTownId} onChange={(e) => setForm({ ...form, attackingTownId: e.target.value })}>
              <option value="">Select your town</option>
              {myTowns.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {myTowns.length === 0 && <p className="text-mc-red text-xs mt-1">You must lead an approved town to declare war.</p>}
          </div>
          <div>
            <label className="block text-sm text-mc-gray mb-1">Enemy Town (Defender) *</label>
            <select className="mc-input" required value={form.defendingTownId} onChange={(e) => setForm({ ...form, defendingTownId: e.target.value })}>
              <option value="">Select enemy town</option>
              {allTowns.filter(t => t.id !== form.attackingTownId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowDeclare(false)} className="mc-btn text-mc-gray hover:text-white">Cancel</button>
            <button type="submit" disabled={creating} className="mc-btn-danger">
              {creating ? 'Sending Notice...' : '⚔ Send War Notice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

