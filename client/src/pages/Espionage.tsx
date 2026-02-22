import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner, StatusBadge, Modal, EmptyState } from '../components/UI';
import { Eye, Plus, AlertTriangle, Lock } from 'lucide-react';

export default function Espionage() {
  const { isAuthenticated } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', details: '', missionType: 'intel' as string,
    severity: 'low' as string, targetTownId: '', isClassified: false,
  });
  const [towns, setTowns] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.espionage.list().then(setReports).catch(console.error).finally(() => setLoading(false));
  }, []);

  const openCreate = async () => {
    try {
      const t = await api.towns.list();
      setTowns(t);
      setShowCreate(true);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const data: any = { ...form };
      if (!data.targetTownId) delete data.targetTownId;
      const report = await api.espionage.create(data);
      setReports([report, ...reports]);
      setShowCreate(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Decrypting reports..." />;

  const missionTypes = ['infiltration', 'sabotage', 'intel', 'counter_spy', 'assassination'];
  const severities = ['low', 'medium', 'high', 'critical'];

  const typeIcons: Record<string, string> = {
    infiltration: '🕵️', sabotage: '💣', intel: '📜',
    counter_spy: '🛡️', assassination: '🗡️',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="w-8 h-8 text-mc-purple" />
          <div>
            <h1 className="text-2xl font-bold">Espionage Bureau</h1>
            <p className="text-mc-gray text-sm">{reports.length} reports on file</p>
          </div>
        </div>
        {isAuthenticated && (
          <button onClick={openCreate} className="mc-btn-blue flex items-center gap-2">
            <Plus size={16} /> New Report
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <EmptyState icon={Eye} title="No intelligence reports" description="The shadows are quiet... for now." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="mc-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{typeIcons[report.missionType] || '📋'}</span>
                  <div>
                    <h3 className="font-bold text-sm">{report.title}</h3>
                    <span className="text-mc-gray text-xs">{report.missionType.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <StatusBadge status={report.status} />
              </div>

              <p className="text-mc-gray text-sm line-clamp-3 mb-3">{report.details}</p>

              {report.intelGained && (
                <div className="p-2 bg-mc-green/5 border border-mc-green/20 rounded text-mc-green text-xs mb-3">
                  <strong>Intel:</strong> {report.intelGained}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-mc-gray pt-3 border-t border-mc-border">
                <div className="flex items-center gap-2">
                  {report.isClassified && <Lock size={10} className="text-mc-red" />}
                  <StatusBadge status={report.severity} />
                </div>
                <div className="flex items-center gap-1">
                  {report.targetTown ? (
                    <span><AlertTriangle size={10} className="inline" /> {report.targetTown.name}</span>
                  ) : (
                    <span>Agent: {report.spy?.username}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Report Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="File Espionage Report">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="p-3 bg-mc-red/10 border border-mc-red/30 rounded-lg text-mc-red text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-mc-gray mb-1">Mission Title *</label>
            <input className="mc-input" required
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Operation codename" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-mc-gray mb-1">Mission Type *</label>
              <select className="mc-input" value={form.missionType}
                onChange={(e) => setForm({ ...form, missionType: e.target.value })}>
                {missionTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Severity</label>
              <select className="mc-input" value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {severities.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-mc-gray mb-1">Target Town</label>
            <select className="mc-input"
              value={form.targetTownId} onChange={(e) => setForm({ ...form, targetTownId: e.target.value })}>
              <option value="">None</option>
              {towns.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-mc-gray mb-1">Details *</label>
            <textarea className="mc-input" rows={4} required minLength={10}
              value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Detailed intelligence report..." />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isClassified}
              onChange={(e) => setForm({ ...form, isClassified: e.target.checked })} />
            <span className="text-mc-gray">🔒 Classified (visible only to you and admins)</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="mc-btn text-mc-gray hover:text-white">Cancel</button>
            <button type="submit" disabled={creating} className="mc-btn-blue">
              {creating ? 'Filing...' : '📋 File Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
