import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';
import '../App.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      login(data.token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest px-6">
      <div className="w-full max-w-md">
        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2 text-center">
          Sideline Sports & Entertainment
        </h1>
        <p className="text-offwhite/60 text-sm mb-8 text-center">Admin Login</p>
        <form
          onSubmit={handleSubmit}
          className="bg-offwhite/5 border border-offwhite/10 p-8 rounded-sm"
        >
          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}
          <label className="block mb-4">
            <span className="text-offwhite text-sm font-medium mb-2 block">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-forest/50 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime"
              placeholder="Admin username"
              required
            />
          </label>
          <label className="block mb-6">
            <span className="text-offwhite text-sm font-medium mb-2 block">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-forest/50 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime"
              placeholder="Password"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-premium py-4 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
