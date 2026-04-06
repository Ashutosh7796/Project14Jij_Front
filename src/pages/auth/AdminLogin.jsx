import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/Jioji_logo.png';
import { useAuth } from '../../context/AuthContext';
import '../auth/Login.css';

const AdminLogin = () => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const emailRef   = useRef(null);

  const [formData, setFormData]       = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    setError('');
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim())    errs.email    = 'Email is required';
    if (!formData.password.trim()) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await login(
        { email: formData.email.trim(), password: formData.password },
        'admin',
      );
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Jioji Green India Logo" />
          <h2>Admin Login</h2>
          <p>Welcome back! Please login to your account</p>
        </div>

        {error && (
          <div className="error-message" style={{
            backgroundColor: '#fee2e2', color: '#991b1b',
            padding: '12px', borderRadius: '8px',
            marginBottom: '20px', border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="admin-email">Email Address</label>
            <input
              ref={emailRef}
              id="admin-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
              style={fieldErrors.email ? { borderColor: '#e53e3e' } : {}}
            />
            {fieldErrors.email && (
              <span style={{ fontSize: 11, color: '#e53e3e', marginTop: 4, display: 'block' }}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              style={fieldErrors.password ? { borderColor: '#e53e3e' } : {}}
            />
            {fieldErrors.password && (
              <span style={{ fontSize: 11, color: '#e53e3e', marginTop: 4, display: 'block' }}>
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="auth-link">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <div className="auth-footer">
          <p>
            Not an admin?{' '}
            <Link to="/auth-login">Employee / Lab Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
