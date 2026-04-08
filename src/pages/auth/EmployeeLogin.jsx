import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/Jioji_logo.png';
import './authPortal.css';
import { useAuth } from '../../context/AuthContext';

const EmployeeLoginNew = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      await login(
        { email: formData.email, password: formData.password },
        'employee'
      );

      navigate('/employee/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-portal-root">
      <div className="auth-portal-card">
        <div className="auth-portal-brand">
          <img src={logo} alt="Jioji Green India" />
        </div>
        <h1 className="auth-portal-title">Employee portal</h1>
        <p className="auth-portal-sub">Sign in with your work email to access surveys, attendance, and field tools.</p>

        {error ? <div className="auth-portal-error">{error}</div> : null}

        <form className="auth-portal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-portal-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-portal-links">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <div className="auth-portal-footer">
          <p>
            Not staff? <Link to="/">Customer home</Link>
            {' · '}
            <Link to="/auth-login">Customer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLoginNew;
