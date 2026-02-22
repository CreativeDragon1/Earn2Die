import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Swords, UserPlus } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [minecraftUuid, setMinecraftUuid] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(username, email, password, minecraftUuid || undefined);
      navigate('/');
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
        'auth/unauthorized-domain': 'This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      };
      setError(msg[err.code] ?? `${err.code ?? 'Error'}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mc-darker p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Swords className="w-12 h-12 text-mc-green mx-auto mb-4 animate-float" />
          <h1 className="mc-heading text-xl text-mc-green mb-2">Earn2Die</h1>
          <p className="text-mc-gray">Join the realm</p>
        </div>

        <div className="mc-card">
          <h2 className="text-xl font-bold mb-6 text-center">Register</h2>

          {error && (
            <div className="p-3 bg-mc-red/10 border border-mc-red/30 rounded-lg text-mc-red text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-mc-gray mb-1">Username</label>
              <input className="mc-input" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+"
                value={username} onChange={(e) => setUsername(e.target.value)} placeholder="YourMinecraftName" />
              <p className="text-mc-gray text-xs mt-1">3-20 characters, letters, numbers, underscores</p>
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Email</label>
              <input className="mc-input" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Password</label>
              <input className="mc-input" type="password" required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              <p className="text-mc-gray text-xs mt-1">Minimum 6 characters</p>
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Minecraft UUID <span className="text-mc-gray text-xs">(optional)</span></label>
              <input className="mc-input" type="text"
                value={minecraftUuid} onChange={(e) => setMinecraftUuid(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              <p className="text-mc-gray text-xs mt-1">Links your in-game identity to this account</p>
            </div>
            <button type="submit" disabled={loading} className="mc-btn-primary w-full flex items-center justify-center gap-2">
              <UserPlus size={16} />
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-mc-gray text-sm mt-6">
            Already have an account? <Link to="/login" className="text-mc-green hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
