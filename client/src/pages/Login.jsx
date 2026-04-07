import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../utils/helpers';

export default function Login() {
  const { login } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      showToast('Welcome back!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Login failed', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <ToastContainer />
      <div className="auth-container">
        <div className="auth-logo-wrapper">
          <div style={{ fontSize: '3.8rem', marginBottom: '4px', filter: 'drop-shadow(0 0 20px rgba(65, 105, 225, 0.4))' }}>🥳</div>
          <h1 className="text-gradient" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0px', letterSpacing: '-2px' }}>Celebrate</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, opacity: 0.7, letterSpacing: '1px' }}>PREMIUM EVENT MANAGEMENT</p>
        </div>

        <div className="card" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.08)', padding: 'var(--space-xl) var(--space-lg)', borderRadius: '32px' }}>
          <h2 style={{ marginBottom: 'var(--space-xl)', fontSize: '1.8rem', fontWeight: 700 }}>Log In</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button id="login-submit" type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ height: '64px', marginTop: 'var(--space-md)' }}>
              {loading ? <span className="spinner" style={{ width: '24px', height: '24px', borderTopColor: '#FFF' }}></span> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 'var(--space-md)' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>Sign Up Free</Link>
        </p>
      </div>
    </div>
  );
}
