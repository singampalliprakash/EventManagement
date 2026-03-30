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
      showToast(err.response?.data?.error || 'Registration failed', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', paddingBottom: '20px' }}>
      <ToastContainer />
      <div className="text-center mb-lg">
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>EventWise</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create your host account</p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Create Account</h2>
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
            <label className="form-label">Email</label>
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
            <label className="form-label">Phone (with country code)</label>
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
            <label className="form-label">Password</label>
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
          <button id="register-submit" type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 'var(--space-md)' }}>
            {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span> : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="text-center mt-lg" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign In</Link>
      </p>
    </div>
  );
}
