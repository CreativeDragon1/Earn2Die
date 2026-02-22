import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner, StatusBadge, Modal, EmptyState } from '../components/UI';
import { Castle, Users, Plus, MapPin, Crown, Shield, ShieldOff, Clock } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  description: '',
  motto: '',
  coordinates: '',
  founderUsernames: '',
};

export default function Towns() {
  const { isAuthenticated, player } = useAuth();
  const [towns, setTowns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.towns.list().then(setTowns).catch(console.error).finally(() => setLoading(false));
  }, []);

  const alreadyInTown = !!player?.townMembership;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    setError('');
    setSuccess('');
    try {
      const founderUsernames = form.founderUsernames
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (founderUsernames.length < 5) {
        setError('You need to list at least 5 founder usernames (comma-separated), including yourself.');
        setApplying(false);
        return;
      }
      const res = await api.towns.apply({ ...form, founderUsernames });
      setSuccess(res.message || 'Application submitted! Await admin approval.');
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading towns..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Castle className="w-8 h-8 text-mc-gold" />
          <div>
            <h1 className="text-2xl font-bold">Towns & Civilizations</h1>
            <p className="text-mc-gray text-sm">{towns.length} approved towns</p>
          </div>
        </div>
        {isAuthenticated && !alreadyInTown && (
          <button onClick={() => setShowApply(true)} className="mc-btn-primary flex items-center gap-2">
            <Plus size={16} /> Apply to Found Town
          </button>
        )}
      </div>

      {/* Permanent membership notice */}
      {alreadyInTown && (
        <div className="p-3 bg-mc-gold/10 border border-mc-gold/30 rounded-lg text-mc-gold text-sm">
          You are a permanent member of <strong>{(player as any).townMembership?.town?.name}</strong>. Town membership in Earn2Die is forever.
        </div>
      )}

      {towns.length === 0 ? (
        <EmptyState icon={Castle} title="No approved towns yet" description="Be the first to apply to found a civilization!" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {towns.map((town) => (
            <Link key={town.id} to={`/towns/${town.id}`} className="mc-card group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg group-hover:text-mc-green transition-colors">{town.name}</h3>
                  {town.motto && <p className="text-mc-gray text-xs italic">"{town.motto}"</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={town.type} />
                  {town.protectionStatus
                    ? <span className="flex items-center gap-1 text-xs text-mc-green"><Shield size={10} /> Protected</span>
                    : <span className="flex items-center gap-1 text-xs text-mc-red"><ShieldOff size={10} /> Unprotected</span>}
                </div>
              </div>

              {town.description && (
                <p className="text-mc-gray text-sm mb-3 line-clamp-2">{town.description}</p>
              )}
              {town.coordinates && (
                <p className="text-mc-gray text-xs mb-2 flex items-center gap-1">
                  <MapPin size={10} /> {town.coordinates}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 text-center py-3 border-t border-mc-border">
                <div>
                  <div className="text-mc-green font-bold">{town.population}</div>
                  <div className="text-mc-gray text-xs flex items-center justify-center gap-1"><Users size={10} /> Pop</div>
                </div>
                <div>
                  <div className="text-mc-gold font-bold">{town.territory}</div>
                  <div className="text-mc-gray text-xs flex items-center justify-center gap-1"><MapPin size={10} /> Chunks</div>
                </div>
                <div>
                  <div className="text-mc-aqua font-bold">Lv.{town.level}</div>
                  <div className="text-mc-gray text-xs">Level</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-mc-border text-xs text-mc-gray">
                <Crown size={12} className="text-mc-gold" />
                <span>{town.owner?.username || 'Unknown'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Apply to Found Town Modal */}
      <Modal open={showApply} onClose={() => { setShowApply(false); setSuccess(''); setError(''); }} title="Apply to Found a Town">
        {success ? (
          <div className="space-y-4">
            <div className="p-3 bg-mc-green/10 border border-mc-green/30 rounded-lg text-mc-green text-sm">{success}</div>
            <div className="p-3 bg-mc-dark/50 rounded-lg text-mc-gray text-xs space-y-1">
              <p className="font-semibold text-white mb-2">What happens next:</p>
              <p>1. The server admin reviews your application.</p>
              <p>2. Once approved, all founders become permanent members.</p>
              <p>3. You'll then need to build a stone perimeter wall, create a dirt path to another town, and write a town constitution (book &amp; quill) to gain Protection Status.</p>
            </div>
            <button onClick={() => { setShowApply(false); setSuccess(''); }} className="mc-btn-primary w-full">Close</button>
          </div>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            {error && <div className="p-3 bg-mc-red/10 border border-mc-red/30 rounded-lg text-mc-red text-sm">{error}</div>}

            <div className="p-3 bg-mc-dark/50 rounded-lg text-mc-gray text-xs space-y-1">
              <p className="font-semibold text-white mb-1">Requirements to found a town:</p>
              <p>• Minimum <strong className="text-mc-gold">5 founding members</strong></p>
              <p>• A <strong className="text-mc-gold">150×150 plot</strong> is granted (+ 50×50 per new registered member)</p>
              <p>• Must build a <strong className="text-mc-gold">stone perimeter wall</strong></p>
              <p>• Must have a <strong className="text-mc-gold">dirt path</strong> connecting to another town</p>
              <p>• Must create a <strong className="text-mc-gold">town constitution</strong> (book &amp; quill, 2 copies)</p>
            </div>

            <div>
              <label className="block text-sm text-mc-gray mb-1">Town Name *</label>
              <input className="mc-input" required minLength={2} maxLength={32}
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter town name" />
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Coordinates *</label>
              <input className="mc-input" required
                value={form.coordinates} onChange={(e) => setForm({ ...form, coordinates: e.target.value })} placeholder="e.g. X: 200, Z: -400" />
              <p className="text-mc-gray text-xs mt-1">In-game location of the proposed town centre</p>
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Founder Usernames * <span className="text-mc-gray text-xs">(include yourself)</span></label>
              <textarea className="mc-input" required rows={2}
                value={form.founderUsernames} onChange={(e) => setForm({ ...form, founderUsernames: e.target.value })}
                placeholder="YourName, Member2, Member3, Member4, Member5" />
              <p className="text-mc-gray text-xs mt-1">Comma-separated, min 5. Each member can only ever belong to one town.</p>
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Description</label>
              <textarea className="mc-input" rows={2}
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your civilization..." />
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Motto</label>
              <input className="mc-input"
                value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} placeholder="Your town's motto" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowApply(false)} className="mc-btn text-mc-gray hover:text-white">Cancel</button>
              <button type="submit" disabled={applying} className="mc-btn-primary">
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
