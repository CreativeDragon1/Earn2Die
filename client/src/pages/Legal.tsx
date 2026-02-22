import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner, StatusBadge, Modal, EmptyState } from '../components/UI';
import { Scale, Plus, Gavel, MessageSquare } from 'lucide-react';

export default function Legal() {
  const { isAuthenticated } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showFile, setShowFile] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', type: 'dispute', priority: 'normal',
    evidence: '', defendantId: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filter) params.status = filter;
    api.legal.list(params).then(setCases).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  const openFile = async () => {
    try {
      const p = await api.players.list();
      setPlayers(p);
      setShowFile(true);
    } catch (err) { console.error(err); }
  };

  const handleFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const data: any = { ...form };
      if (!data.evidence) delete data.evidence;
      const newCase = await api.legal.file(data);
      setCases([newCase, ...cases]);
      setShowFile(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading court records..." />;

  const statuses = ['', 'filed', 'under_review', 'trial', 'deliberation', 'closed'];
  const types = ['dispute', 'criminal', 'appeal', 'treaty_violation', 'land_claim'];
  const priorities = ['low', 'normal', 'high', 'urgent'];

  const typeIcons: Record<string, string> = {
    dispute: '⚖️', criminal: '🚨', appeal: '📜',
    treaty_violation: '📋', land_claim: '🗺️',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-mc-gold" />
          <div>
            <h1 className="text-2xl font-bold">Court of Justice</h1>
            <p className="text-mc-gray text-sm">{cases.length} cases on record</p>
          </div>
        </div>
        {isAuthenticated && (
          <button onClick={openFile} className="mc-btn-gold flex items-center gap-2">
            <Plus size={16} /> File Case
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${filter === s
                ? 'bg-mc-gold/20 text-mc-gold border border-mc-gold/30'
                : 'bg-mc-card text-mc-gray hover:text-white border border-mc-border'
              }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {cases.length === 0 ? (
        <EmptyState icon={Scale} title="No cases filed" description="Justice prevails. The court is empty." />
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <Link key={c.id} to={`/legal/${c.id}`} className="mc-card block group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{typeIcons[c.type] || '⚖️'}</span>
                  <div>
                    <h3 className="font-bold group-hover:text-mc-gold transition-colors">{c.title}</h3>
                    <span className="text-mc-gray text-xs">{c.type.replace(/_/g, ' ')} &bull; Filed {new Date(c.filedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.priority} />
                  <StatusBadge status={c.status} />
                </div>
              </div>

              <p className="text-mc-gray text-sm line-clamp-2 mb-3">{c.description}</p>

              <div className="flex items-center justify-between text-xs text-mc-gray pt-3 border-t border-mc-border">
                <div className="flex items-center gap-4">
                  <span>Plaintiff: <strong className="text-mc-green">{c.plaintiff?.username}</strong></span>
                  <span>Defendant: <strong className="text-mc-red">{c.defendant?.username}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  {c.judge && (
                    <span className="flex items-center gap-1">
                      <Gavel size={10} /> Judge {c.judge.username}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MessageSquare size={10} /> {c._count?.comments || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* File Case Modal */}
      <Modal open={showFile} onClose={() => setShowFile(false)} title="File Legal Case">
        <form onSubmit={handleFile} className="space-y-4">
          {error && <div className="p-3 bg-mc-red/10 border border-mc-red/30 rounded-lg text-mc-red text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-mc-gray mb-1">Case Title *</label>
            <input className="mc-input" required
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief case title" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-mc-gray mb-1">Type</label>
              <select className="mc-input" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {types.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Priority</label>
              <select className="mc-input" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Defendant *</label>
              <select className="mc-input" required
                value={form.defendantId} onChange={(e) => setForm({ ...form, defendantId: e.target.value })}>
                <option value="">Select player</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-mc-gray mb-1">Description *</label>
            <textarea className="mc-input" rows={4} required minLength={20}
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed description of the dispute or complaint..." />
          </div>
          <div>
            <label className="block text-sm text-mc-gray mb-1">Evidence</label>
            <textarea className="mc-input" rows={2}
              value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })}
              placeholder="Supporting evidence, screenshots, references..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowFile(false)} className="mc-btn text-mc-gray hover:text-white">Cancel</button>
            <button type="submit" disabled={creating} className="mc-btn-gold">
              {creating ? 'Filing...' : '⚖ File Case'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
