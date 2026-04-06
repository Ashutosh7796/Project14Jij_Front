import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/Jioji_logo.png';
import { authApi } from '../../api/authApi';
import { useToast } from '../../hooks/useToast';
import '../auth/Login.css';

const Register = () => {
  const { showToast, ToastComponent } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      await authApi.register(registerData);
      showToast('Registration successful! Please login.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Logo" />
          <h2>Create Account</h2>
          <p>Join FarmDirect today</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter your phone" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" required />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};

export default Register;
