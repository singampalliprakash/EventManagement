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
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', paddingBottom: '20px' }}>
      <ToastContainer />
      <div className="text-center mb-lg">
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>EventWise</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage events, wishlists & RSVPs</p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Welcome back</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
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
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 'var(--space-md)' }}>
            {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span> : 'Sign In'}
          </button>
        </form>
      </div>

      <p className="text-center mt-lg" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>Sign Up</Link>
      </p>
    </div>
  );
}
