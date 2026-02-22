import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner, StatusBadge } from '../components/UI';
import { Scale, Gavel, MessageSquare, User, Send, CheckCircle } from 'lucide-react';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { player, isAuthenticated } = useAuth();
  const [legalCase, setLegalCase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) api.legal.get(id).then(setLegalCase).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    try {
      await api.legal.addComment(id!, { content: comment });
      const updated = await api.legal.get(id!);
      setLegalCase(updated);
      setComment('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!legalCase) return <div className="text-center py-20 text-mc-gray">Case not found</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/legal" className="text-mc-green text-sm hover:underline">&larr; Back to Court</Link>

      {/* Case Header */}
      <div className="mc-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-mc-gold" />
            <div>
              <h1 className="text-2xl font-bold">{legalCase.title}</h1>
              <span className="text-mc-gray text-sm">{legalCase.type.replace(/_/g, ' ')} &bull; Filed {new Date(legalCase.filedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={legalCase.priority} />
            <StatusBadge status={legalCase.status} />
          </div>
        </div>

        <p className="text-mc-gray mb-4">{legalCase.description}</p>

        {legalCase.evidence && (
          <div className="p-3 bg-mc-gold/5 border border-mc-gold/20 rounded-lg mb-4">
            <strong className="text-mc-gold text-sm">Evidence:</strong>
            <p className="text-mc-gray text-sm mt-1">{legalCase.evidence}</p>
          </div>
        )}

        {/* Parties */}
        <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-mc-border">
          <div className="text-center p-3 bg-mc-dark rounded-lg">
            <User size={18} className="text-mc-green mx-auto mb-1" />
            <div className="text-mc-green font-bold">{legalCase.plaintiff?.username}</div>
            <div className="text-mc-gray text-xs">Plaintiff</div>
          </div>
          <div className="text-center p-3 bg-mc-dark rounded-lg">
            <Gavel size={18} className="text-mc-gold mx-auto mb-1" />
            <div className="text-mc-gold font-bold">{legalCase.judge?.username || 'Pending'}</div>
            <div className="text-mc-gray text-xs">Judge</div>
          </div>
          <div className="text-center p-3 bg-mc-dark rounded-lg">
            <User size={18} className="text-mc-red mx-auto mb-1" />
            <div className="text-mc-red font-bold">{legalCase.defendant?.username}</div>
            <div className="text-mc-gray text-xs">Defendant</div>
          </div>
        </div>
      </div>

      {/* Verdict */}
      {legalCase.verdict && (
        <div className="mc-card border-mc-gold/30">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="text-mc-gold" size={20} />
            <h2 className="font-bold text-mc-gold">Verdict</h2>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={legalCase.verdict.decision} />
            <span className="text-mc-gray text-sm">by Judge {legalCase.verdict.judge?.username}</span>
            <span className="text-mc-gray text-xs">{new Date(legalCase.verdict.issuedAt).toLocaleDateString()}</span>
          </div>
          <p className="text-mc-gray">{legalCase.verdict.reasoning}</p>
          {legalCase.verdict.penalty && (
            <div className="mt-2 p-2 bg-mc-red/10 border border-mc-red/20 rounded text-mc-red text-sm">
              <strong>Penalty:</strong> {legalCase.verdict.penalty}
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <div className="mc-card">
        <h2 className="flex items-center gap-2 font-bold mb-4">
          <MessageSquare size={18} className="text-mc-blue" />
          Court Records ({legalCase.comments?.length || 0})
        </h2>

        <div className="space-y-3 mb-4">
          {(legalCase.comments || []).map((c: any) => (
            <div key={c.id} className={`p-3 rounded-lg ${c.isOfficial ? 'bg-mc-gold/5 border border-mc-gold/20' : 'bg-mc-dark'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm ${c.isOfficial ? 'text-mc-gold' : 'text-white'}`}>
                    {c.author?.username}
                  </span>
                  {c.isOfficial && <span className="text-mc-gold text-xs">[OFFICIAL]</span>}
                </div>
                <span className="text-mc-gray text-xs">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-mc-gray text-sm">{c.content}</p>
            </div>
          ))}
        </div>

        {isAuthenticated && legalCase.status !== 'closed' && (
          <form onSubmit={handleComment} className="flex gap-2">
            <input className="mc-input flex-1" placeholder="Add a comment..."
              value={comment} onChange={(e) => setComment(e.target.value)} required />
            <button type="submit" disabled={sending} className="mc-btn-blue flex items-center gap-2">
              <Send size={14} /> Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
