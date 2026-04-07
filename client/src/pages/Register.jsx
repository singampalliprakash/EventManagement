import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../utils/helpers';

export default function Register() {
  const { register } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      showToast('Account created! 🎉');
    } catch (err) {
      const errorMsg = err.response?.data?.details?.join(', ') || err.response?.data?.error || 'Registration failed';
      showToast(errorMsg, 'error');
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, opacity: 0.7, letterSpacing: '1px' }}>CREATE YOUR HOST ACCOUNT</p>
        </div>

        <div className="card" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.08)', padding: 'var(--space-xl) var(--space-lg)', borderRadius: '32px' }}>
          <h2 style={{ marginBottom: 'var(--space-xl)', fontSize: '1.8rem', fontWeight: 700 }}>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                id="register-name"
                type="text"
                className="form-input"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="register-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone (WhatsApp)</label>
              <input
                id="register-phone"
                type="tel"
                className="form-input"
                placeholder="919876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Set Password</label>
              <input
                id="register-password"
                type="password"
                className="form-input"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button id="register-submit" type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ height: '64px', marginTop: 'var(--space-md)' }}>
              {loading ? <span className="spinner" style={{ width: '24px', height: '24px', borderTopColor: '#FFF' }}></span> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 'var(--space-md)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>Sign In Here</Link>
        </p>
      </div>
    </div>
  );
}
