import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './authLogin.css';
import jioji from '../../assets/Jioji_logo.png';
import { FaUserAlt, FaEnvelope, FaPhone } from 'react-icons/fa';
import { IoEye, IoEyeOff } from 'react-icons/io5';
import { authApi } from '../../api/authApi';
import { useToast } from '../../hooks/useToast';
import { sanitizeString, sanitizeEmail, sanitizePhone } from '../../utils/sanitize';
import MatrixBackground from '../../components/MatrixBackground';

const Register = () => {
  const { showToast, ToastComponent } = useToast();
  const navigate = useNavigate();
  const firstRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacyPolicy: false,
  });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (formData.password !== formData.confirmPassword) {
      setApiError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setApiError('Password must be at least 8 characters');
      return;
    }
    const digits = String(formData.phone).replace(/\D/g, '');
    if (digits.length < 10) {
      setApiError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.acceptTerms || !formData.acceptPrivacyPolicy) {
      setApiError('Please accept the Terms and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        firstName: sanitizeString(formData.firstName),
        lastName: sanitizeString(formData.lastName),
        email: sanitizeEmail(formData.email),
        phone: sanitizePhone(formData.phone),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.acceptTerms,
        acceptPrivacyPolicy: formData.acceptPrivacyPolicy,
      });
      showToast('Account created. Sign in with your email and password.', 'success');
      navigate('/auth-login', { replace: true });
    } catch (err) {
      setApiError(err?.message || err?.userMessage || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authBg">
      <div className="authBgOrbs" aria-hidden />
      <MatrixBackground />
      <Link to="/" className="authBackHome">
        ← Back to home
      </Link>
      <div className="authCard glassCard authCardGlow authCardWide">
        <div className="authBrand">
          <img className="authLogo" src={jioji} alt="Jioji Green India" />
        </div>

        <h1 className="authHeading">Create account</h1>
        <p className="authSubheading">Join FarmDirect to shop seeds, track orders, and manage your farm profile.</p>

        {apiError && <div className="authError">{apiError}</div>}

        <form className="authForm" onSubmit={handleSubmit}>
          <div className="authFormRow2">
            <label className="authLabel">
              First name
              <div className="authField">
                <input
                  ref={firstRef}
                  className="authInput"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                />
                <span className="authIcon">
                  <FaUserAlt />
                </span>
              </div>
            </label>
            <label className="authLabel">
              Last name
              <div className="authField">
                <input
                  className="authInput"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                />
                <span className="authIcon">
                  <FaUserAlt />
                </span>
              </div>
            </label>
          </div>

          <label className="authLabel">
            Email
            <div className="authField">
              <input
                className="authInput"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <span className="authIcon">
                <FaEnvelope />
              </span>
            </div>
          </label>

          <label className="authLabel">
            Mobile number
            <div className="authField">
              <input
                className="authInput"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile"
                autoComplete="tel"
                required
              />
              <span className="authIcon">
                <FaPhone />
              </span>
            </div>
          </label>

          <label className="authLabel">
            Password
            <div className="authField">
              <input
                className="authInput"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="authIconBtn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </button>
            </div>
          </label>

          <label className="authLabel">
            Confirm password
            <div className="authField">
              <input
                className="authInput"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="authIconBtn"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <IoEyeOff /> : <IoEye />}
              </button>
            </div>
          </label>

          <div className="authRow" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <label className="authRemember">
              <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} />
              I accept the Terms &amp; Conditions
            </label>
            <label className="authRemember">
              <input
                type="checkbox"
                name="acceptPrivacyPolicy"
                checked={formData.acceptPrivacyPolicy}
                onChange={handleChange}
              />
              I accept the Privacy Policy
            </label>
          </div>

          <button className="authBtn" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p className="authAltAccount">
            Already have an account? <Link to="/auth-login">Sign in</Link>
          </p>

          <div className="authTiny">Your information is used only to manage your FarmDirect account.</div>
        </form>
      </div>

      <ToastComponent />
    </div>
  );
};

export default Register;
