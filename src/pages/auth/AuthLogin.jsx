import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./authLogin.css";
import jioji from "../../assets/Jioji_logo.png";
import { FaUserAlt } from "react-icons/fa";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useAuth } from "../../context/AuthContext";
import MatrixBackground from "../../components/MatrixBackground";

/* ── role → dashboard path ───────────────────────────────── */
function getDashboardPath(role = "") {
  const r = String(role).toUpperCase().replace(/^ROLE_/, "");
  if (r === "ADMIN")                         return "/admin/dashboard";
  if (r === "EMPLOYEE" || r === "SURVEYOR")  return "/employee/dashboard";
  if (r === "LAB" || r === "LAB_TECHNICIAN") return "/lab/dashboard";
  if (r === "USER")                          return "/dashboard";
  return "/";
}

/* ── component ───────────────────────────────────────────── */
export default function AuthLogin() {
  const { login }  = useAuth();          // ← context login, sets isAuthenticated
  const navigate   = useNavigate();
  const userIdRef  = useRef(null);

  const [userId,       setUserId]       = useState("");
  const [password,     setPassword]     = useState("");
  const [rememberMe,   setRememberMe]   = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [apiError,     setApiError]     = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { userIdRef.current?.focus(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!userId.trim() || !password.trim()) {
      setApiError("Username and password are required");
      return;
    }

    setLoading(true);
    try {
      /*
       * useAuth().login() calls authService.login() internally AND
       * calls setUser() so isAuthenticated flips to true BEFORE navigate().
       * Route guards will therefore pass on the very next render.
       */
      const response = await login(
        { email: userId.trim(), password },
        "user",
      );

      // Role comes from the API response; fall back to what authService stored
      const role = response?.roles?.[0] ?? localStorage.getItem("role") ?? "";
      navigate(getDashboardPath(role), { replace: true });
    } catch (err) {
      setApiError(err?.message || "Login failed");
      userIdRef.current?.focus();
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
      <div className="authCard glassCard authCardGlow">
        <div className="authBrand">
          <img className="authLogo" src={jioji} alt="Jioji Green India" />
        </div>

        <h1 className="authHeading">Welcome back</h1>
        <p className="authSubheading">Sign in to shop seeds, track orders, and manage your farm account.</p>

        {apiError && <div className="authError">{apiError}</div>}

        <form className="authForm" onSubmit={onSubmit}>
          <label className="authLabel">
            Username
            <div className="authField">
              <input
                ref={userIdRef}
                className="authInput"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter Username / Email"
                autoComplete="username"
              />
              <span className="authIcon"><FaUserAlt /></span>
            </div>
          </label>

          <label className="authLabel">
            Password
            <div className="authField">
              <input
                className="authInput"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="authIconBtn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </button>
            </div>
          </label>

          <div className="authRow">
            <label className="authRemember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <button type="button" className="authLinkBtn" onClick={() => navigate("/forgot-password")}>
              Forget Password?
            </button>
          </div>

          <button className="authBtn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="authAltAccount">
            New here? <Link to="/register">Create an account</Link>
          </p>

          <div className="authTiny">
            By signing in you agree to our T&amp;C and Privacy Policy
          </div>
        </form>
      </div>
    </div>
  );
}
