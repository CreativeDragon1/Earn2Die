import { Link } from 'react-router-dom';
import { Home, Skull } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="text-center py-20 animate-fade-in">
      <Skull className="w-16 h-16 text-mc-red mx-auto mb-4" />
      <h1 className="mc-heading text-2xl text-mc-red mb-4">404</h1>
      <p className="text-mc-gray text-lg mb-6">
        You have wandered into the void. This land does not exist.
      </p>
      <Link to="/" className="mc-btn-primary inline-flex items-center gap-2">
        <Home size={16} /> Return to Spawn
      </Link>
    </div>
  );
}
