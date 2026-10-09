import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";
const DASHBOARD_URL = (process.env.REACT_APP_DASHBOARD_URL || "http://localhost:3000").replace(/\/+$/, "");

function SignUp() {
  const [isRegistering, setIsRegistering] = useState(true);
  const [form, setForm] = useState({ username: "", email: "", identifier: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError(false);
    setLoading(true);
    try {
      const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegistering
        ? { username: form.username, email: form.email, password: form.password }
        : { identifier: form.identifier, password: form.password };
      const { data } = await axios.post(`${API_URL}${endpoint}`, payload);
      const handoff = await axios.post(
        `${API_URL}/api/auth/handoff`,
        {},
        { headers: { Authorization: `Bearer ${data.token}` } },
      );
      setMessage("Signed in. Opening your trading dashboard…");
      window.location.assign(`${DASHBOARD_URL}/?handoff=${encodeURIComponent(handoff.data.code)}`);
    } catch (requestError) {
      setError(true);
      setLoading(false);
      setMessage(requestError.response?.data?.message || "Could not connect to the trading service. Make sure the backend is running.");
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setMessage("");
    setError(false);
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{isRegistering ? "Create your account" : "Sign in to your account"}</h1>
        <p>{isRegistering ? "Sign up to get started with your trading account." : "Use the username or email you registered with."}</p>
        {isRegistering ? (
          <>
            <label>Username<input autoComplete="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
            <label>Email<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          </>
        ) : (
          <label>Username or email<input autoComplete="username" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} /></label>
        )}
        <label>Password<input type="password" autoComplete={isRegistering ? "new-password" : "current-password"} minLength={isRegistering ? 8 : undefined} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button type="submit" disabled={loading}>{loading ? "Please wait…" : isRegistering ? "Create account" : "Sign in"}</button>
        <button type="button" className="auth-mode-toggle" disabled={loading} onClick={toggleMode}>
          {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        {message && <p role="status" className={error ? "auth-message error" : "auth-message"}>{message}</p>}
      </form>
    </main>
  );
}

export default SignUp;
