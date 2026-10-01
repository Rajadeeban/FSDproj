import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, LogIn, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@greenh2.com', password: 'Admin@123' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 px-4">
      <div className="w-full max-w-sm animate-fadeIn">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-brand-600 flex items-center justify-center mb-3">
            <Leaf size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">GreenH2 Platform</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">Green Hydrogen Optimization</p>
        </div>

        <div className="card">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-text">Email</label>
              <input type="email" required className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Password</label>
              <input type="password" required className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              Sign in
            </button>
          </form>
          <p className="text-xs text-center text-ink-400 mt-4">
            Demo: admin@greenh2.com / Admin@123 &nbsp;or&nbsp; user@greenh2.com / User@123
          </p>
        </div>

        <p className="text-sm text-center text-ink-500 dark:text-ink-400 mt-5">
          No account? <Link to="/register" className="text-brand-600 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
