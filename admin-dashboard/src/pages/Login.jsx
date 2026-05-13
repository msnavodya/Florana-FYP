// Render the admin dashboard page for Login.
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Leaf, Loader2 } from 'lucide-react';
import { auth } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@florana.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (auth.isAdmin()) {
    return <Navigate to="/" replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await auth.login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbf7fd] px-4">
      <section className="w-full max-w-md rounded-lg bg-white p-7 shadow-soft ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-[linear-gradient(180deg,#aa73c4_0%,#8d56af_100%)] p-3 text-white">
            <Leaf size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Florana Admin</h1>
            <p className="text-sm text-slate-500">Sign in to manage Florana</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-forest-700 focus:ring-2 focus:ring-forest-100"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-forest-700 focus:ring-2 focus:ring-forest-100"
              required
            />
          </label>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(180deg,#aa73c4_0%,#8d56af_100%)] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Login
          </button>
        </form>
      </section>
    </main>
  );
}
