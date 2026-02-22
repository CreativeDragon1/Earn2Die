import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Swords, LogIn } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found': 'No account found with that email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      };
      setError(msg[err.code] ?? err.message);
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
          <p className="text-mc-gray">Enter your realm</p>
        </div>

        <div className="mc-card">
          <h2 className="text-xl font-bold mb-6 text-center">Login</h2>

          {error && (
            <div className="p-3 bg-mc-red/10 border border-mc-red/30 rounded-lg text-mc-red text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-mc-gray mb-1">Email</label>
              <input className="mc-input" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm text-mc-gray mb-1">Password</label>
              <input className="mc-input" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="mc-btn-primary w-full flex items-center justify-center gap-2">
              <LogIn size={16} />
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-mc-gray text-sm mt-6">
            New player? <Link to="/register" className="text-mc-green hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
