import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner, StatusBadge, Modal, EmptyState } from '../components/UI';
import { ShoppingBag, Plus, Search, Filter, ArrowLeftRight } from 'lucide-react';

const categories = ['all', 'weapons', 'armor', 'tools', 'blocks', 'food', 'potions', 'enchants', 'misc'];
const CURRENCIES = ['diamonds', 'iron', 'gold', 'emeralds', 'other'];

const categoryIcons: Record<string, string> = {
  weapons: '⚔️', armor: '🛡️', tools: '⛏️', blocks: '🧱',
  food: '🍖', potions: '🧪', enchants: '✨', misc: '📦',
};

const currencyIcon: Record<string, string> = {
  diamonds: '💎', iron: '⚙️', gold: '🥇', emeralds: '💚', other: '🪙',
};

const EMPTY_FORM = {
  itemName: '', description: '', category: 'misc',
  isBarter: false,
  price: '', preferredCurrency: 'diamonds',
  barterItemName: '', barterQuantity: '1',
  quantity: '1',
};

export default function Trade() {
  const { isAuthenticated, player } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchListings = () => {
    const params: Record<string, string> = {};
    if (category !== 'all') params.category = category;
    if (search) params.search = search;
    api.trade.list(params).then(setListings).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, [category]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setLoading(true); fetchListings(); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const data: any = {
        itemName: form.itemName,
        description: form.description,
        category: form.category,
        quantity: Number(form.quantity),
        isBarter: form.isBarter,
      };
      if (form.isBarter) {
        data.barterItemName = form.barterItemName;
        data.barterQuantity = Number(form.barterQuantity);
      } else {
        data.price = Number(form.price);
        data.preferredCurrency = form.preferredCurrency;
      }
      const listing = await api.trade.create(data);
      setListings([listing, ...listings]);
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleBuy = async (listingId: string, price: number, currency: string) => {
    if (!confirm(`Purchase for ${price} ${currency}?`)) return;
    try {
      await api.trade.buy(listingId, 1);
      fetchListings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner text="Loading marketplace..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-mc-aqua" />
          <div>
            <h1 className="text-2xl font-bold">Trade Marketplace</h1>
            <p className="text-mc-gray text-sm">{listings.length} items available</p>
          </div>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowCreate(true)} className="mc-btn-primary flex items-center gap-2">
            <Plus size={16} /> List Item / Open Store
          </button>
        )}
      </div>

      <div className="p-3 bg-mc-dark/50 border border-mc-border rounded-lg text-mc-gray text-xs space-y-1">
        <p className="font-semibold text-white mb-1">📜 Trade Rules</p>
        <p>• Any individual or town can open a store. Stores cannot be griefed or stolen from.</p>
        <p>• Perpetrators of store theft face trial. Specify your preferred currency or offer barter (resource-for-resource).</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mc-gray" />
            <input className="mc-input pl-10" placeholder="Search items..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="mc-btn-primary">Search</button>
        </form>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Filter size={14} className="text-mc-gray mt-1" />
        {categories.map((c) => (
          <button key={c} onClick={() => { setCategory(c); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1
              ${category === c ? 'bg-mc-aqua/20 text-mc-aqua border border-mc-aqua/30' : 'bg-mc-card text-mc-gray hover:text-white border border-mc-border'}`}>
            {c !== 'all' && <span>{categoryIcons[c]}</span>}
            {c}
          </button>
        ))}
      </div>

      {listings.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No items found" description="The marketplace is empty. Be the first to list!" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((item) => (
            <div key={item.id} className="mc-card flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{categoryIcons[item.category] || '📦'}</span>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={item.category} />
                  {item.isBarter && (
                    <span className="flex items-center gap-1 text-xs text-mc-purple bg-mc-purple/10 px-1 py-0.5 rounded">
                      <ArrowLeftRight size={10} /> Barter
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-bold mb-1">{item.itemName}</h3>
              {item.description && <p className="text-mc-gray text-sm line-clamp-2 mb-3">{item.description}</p>}

              <div className="mt-auto pt-3 border-t border-mc-border">
                {item.isBarter ? (
                  <div className="text-sm mb-2">
                    <span className="text-mc-gray">Want: </span>
                    <span className="text-mc-purple font-bold">{item.barterQuantity}x {item.barterItemName}</span>
                    <p className="text-mc-gray text-xs mt-0.5">Arrange exchange in-game</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-mc-gold font-bold text-lg">
                      {currencyIcon[item.preferredCurrency] || '🪙'} {item.price} {item.preferredCurrency}
                    </span>
                    <span className="text-mc-gray text-sm">Qty: {item.quantity}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-mc-gray text-xs">by {item.seller?.username}</span>
                  {isAuthenticated && item.seller?.id !== player?.id && !item.isBarter && (
                    <button onClick={() => handleBuy(item.id, item.price, item.preferredCurrency)} className="mc-btn-primary text-xs py-1 px-3">
                      Buy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Listing Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="List Item / Open Store">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="p-3 bg-mc-red/10 border border-mc-red/30 rounded-lg text-mc-red text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-mc-gray mb-1">Item Name *</label>
            <input className="mc-input" required
              value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="e.g. Diamond Sword (Sharpness V)" />
          </div>
          <div>
            <label className="block text-sm text-mc-gray mb-1">Description</label>
            <textarea className="mc-input" rows={2}
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Item details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-mc-gray mb-1">Category</label>
              <select className="mc-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Quantity</label>
              <input className="mc-input" type="number" min="1"
                value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
          </div>

          {/* Barter toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isBarter} onChange={(e) => setForm({ ...form, isBarter: e.target.checked })} className="rounded" />
            <span className="text-mc-gray">Resource-for-resource barter (instead of currency)</span>
          </label>

          {form.isBarter ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-mc-gray mb-1">Want (Item Name) *</label>
                <input className="mc-input" required
                  value={form.barterItemName} onChange={(e) => setForm({ ...form, barterItemName: e.target.value })} placeholder="e.g. Emeralds" />
              </div>
              <div>
                <label className="block text-sm text-mc-gray mb-1">Quantity Wanted *</label>
                <input className="mc-input" type="number" min="1" required
                  value={form.barterQuantity} onChange={(e) => setForm({ ...form, barterQuantity: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-mc-gray mb-1">Price *</label>
                <input className="mc-input" type="number" required min="0.01" step="0.01"
                  value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label className="block text-sm text-mc-gray mb-1">Preferred Currency</label>
                <select className="mc-input" value={form.preferredCurrency} onChange={(e) => setForm({ ...form, preferredCurrency: e.target.value })}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{currencyIcon[c]} {c}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="mc-btn text-mc-gray hover:text-white">Cancel</button>
            <button type="submit" disabled={creating} className="mc-btn-primary">
              {creating ? 'Listing...' : '📦 List Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


