import React, { useState } from "react";
import axios from "axios";

const AuthContext = React.createContext(null);
export const useAuth = () => React.useContext(AuthContext);

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";

export const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function AuthGate({ children }) {
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(token));
  const [user, setUser] = useState(null);
  const handoffStarted = React.useRef(null);
  const handoffCode = new URLSearchParams(window.location.search).get("handoff");

  React.useEffect(() => {
    if (handoffCode) {
      if (handoffStarted.current === handoffCode) return;
      handoffStarted.current = handoffCode;
      setLoading(true);
      axios.post(`${API_URL}/api/auth/handoff/exchange`, { code: handoffCode }).then(({ data }) => {
        localStorage.setItem("authToken", data.token);
        window.history.replaceState({}, "", window.location.pathname);
        setError("");
        setToken(data.token);
      }).catch((requestError) => {
        localStorage.removeItem("authToken");
        window.history.replaceState({}, "", window.location.pathname);
        setUser(null);
        setToken(null);
        setError(requestError.response?.data?.message || "Unable to complete sign in. Please try again.");
        setLoading(false);
      });
      return;
    }
    if (!token) { setUser(null); setLoading(false); return; }
    setLoading(true);
    api.get("/api/auth/me").then(({ data }) => {
      setUser(data);
      setLoading(false);
    }).catch(() => {
      localStorage.removeItem("authToken");
      setUser(null);
      setToken(null);
      setLoading(false);
    });
  }, [token, handoffCode]);

  const signIn = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { identifier, password });
      localStorage.setItem("authToken", data.token);
      setLoading(true);
      setToken(data.token);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to sign in. Check that the API is running.");
    }
  };

  const register = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/register`, { username, email, password });
      localStorage.setItem("authToken", data.token);
      setLoading(true);
      setToken(data.token);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create your account. Check that the API is running.");
    }
  };

  if (loading) return <div className="auth-screen">Checking your session…</div>;
  if (!token) return (
    <main className="auth-screen">
      <form className="auth-form" onSubmit={isRegistering ? register : signIn}>
        <h1>{isRegistering ? "Create your account" : "Sign in to your account"}</h1>
        <p>{isRegistering ? "Create an account to access your trading dashboard." : "Use the username or email you registered with."}</p>
        {isRegistering ? (
          <>
            <label>Username<input autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} /></label>
            <label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          </>
        ) : (
          <label>Username or email<input autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></label>
        )}
        <label>Password<input type="password" autoComplete={isRegistering ? "new-password" : "current-password"} minLength={isRegistering ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit">{isRegistering ? "Create account" : "Sign in"}</button>
        <button type="button" className="auth-mode-toggle" onClick={() => { setError(""); setIsRegistering(!isRegistering); }}>
          {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </form>
    </main>
  );
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function SignOutButton() {
  return <button className="signout-button" onClick={() => { localStorage.removeItem("authToken"); window.location.reload(); }}>Sign out</button>;
}
