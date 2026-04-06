import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/Jioji_logo.png';
import '../auth/Login.css';
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

      // useAuth().login() sets isAuthenticated=true before navigate fires
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Logo" />
          <h2>Employee Login</h2>
          <p>Welcome back! Please login to your account</p>
        </div>

        {error && (
          <div
            className="error-message"
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #fecaca'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-link">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <div className="auth-footer">
          <p>
            Not an employee?{' '}
            <Link to="/login">User Login</Link>
            {' '}or{' '}
            <Link to="/login"> Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLoginNew;
