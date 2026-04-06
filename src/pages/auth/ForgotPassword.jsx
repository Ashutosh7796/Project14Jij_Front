import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import logo from '../../assets/Jioji_logo.png'; 
import '../auth/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      
      await authService.forgotPassword(email);
      setMessage('Password reset link has been sent to your email');
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg-container">
      <div className="login-white-card"> 
        <div className="login-header">
          <img src={logo} alt="JIOJI GREEN INDIA" className="login-logo-img" />
          <h1 className="brand-name">Farm Products & Seeds</h1>
          <h2 className="portal-sub">Admin Portal</h2>
        </div>

        <p className="forgot-helper-text">
          Enter your registered email or employee ID/Number
        </p>

        {error && <div className="error-text">{error}</div>}
        {message && <div className="success-text" style={{ color: '#2ecc71', fontSize: '13px', marginBottom: '15px' }}>{message}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-field-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Mail ID"
              required
              className="login-input"
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-link-footer" style={{ marginTop: '15px', fontSize: '12px' }}>
          Remember password? <Link to="/admin-login" className="forgot-link">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;