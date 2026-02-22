import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <Loader2 className="w-8 h-8 text-mc-green animate-spin mb-3" />
      <p className="text-mc-gray text-sm">{text}</p>
    </div>
  );
}

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const colors: Record<string, string> = {
    // War statuses
    declared: 'bg-mc-yellow/20 text-mc-yellow',
    active: 'bg-mc-red/20 text-mc-red',
    ceasefire: 'bg-mc-blue/20 text-mc-blue',
    ended: 'bg-mc-gray/20 text-mc-gray',
    // Espionage
    pending: 'bg-mc-yellow/20 text-mc-yellow',
    in_progress: 'bg-mc-blue/20 text-mc-blue',
    completed: 'bg-mc-green/20 text-mc-green',
    failed: 'bg-mc-red/20 text-mc-red',
    intercepted: 'bg-mc-purple/20 text-mc-purple',
    // Trade
    sold: 'bg-mc-green/20 text-mc-green',
    expired: 'bg-mc-gray/20 text-mc-gray',
    cancelled: 'bg-mc-red/20 text-mc-red',
    // Legal
    filed: 'bg-mc-yellow/20 text-mc-yellow',
    under_review: 'bg-mc-blue/20 text-mc-blue',
    trial: 'bg-mc-purple/20 text-mc-purple',
    deliberation: 'bg-mc-gold/20 text-mc-gold',
    closed: 'bg-mc-gray/20 text-mc-gray',
    // Town types
    settlement: 'bg-mc-gray/20 text-mc-gray',
    village: 'bg-mc-green/20 text-mc-green',
    town: 'bg-mc-blue/20 text-mc-blue',
    city: 'bg-mc-gold/20 text-mc-gold',
    kingdom: 'bg-mc-purple/20 text-mc-purple',
    empire: 'bg-mc-red/20 text-mc-red',
    // Severity
    low: 'bg-mc-green/20 text-mc-green',
    medium: 'bg-mc-yellow/20 text-mc-yellow',
    high: 'bg-mc-gold/20 text-mc-gold',
    critical: 'bg-mc-red/20 text-mc-red',
    // General
    open: 'bg-mc-green/20 text-mc-green',
    normal: 'bg-mc-blue/20 text-mc-blue',
    urgent: 'bg-mc-red/20 text-mc-red',
  };

  return (
    <span className={`mc-badge ${colors[status] || 'bg-mc-gray/20 text-mc-gray'} ${className}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon?: React.ElementType }) {
  return (
    <div className="text-center py-16 animate-fade-in">
      {Icon && <Icon className="w-12 h-12 text-mc-border mx-auto mb-4" />}
      <h3 className="text-lg font-semibold text-mc-gray mb-2">{title}</h3>
      <p className="text-mc-gray/60 text-sm">{description}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div
        className="relative bg-mc-dark border border-mc-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-mc-gray hover:text-white text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
