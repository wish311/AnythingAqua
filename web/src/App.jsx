import { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: true
});

const AuthContext = createContext();

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      const res = await api.get('/api/subscription/status');
      setStatus(res.data);
      setUser({ subscriptionTier: res.data.tier });
    } catch (err) {
      setStatus(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const login = async (email, password) => {
    await api.post('/api/auth/login', { email, password });
    await loadStatus();
  };

  const signup = async (email, password) => {
    await api.post('/api/auth/signup', { email, password });
    await loadStatus();
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
    setStatus(null);
  };

  return (
    <AuthContext.Provider value={{ user, status, loading, login, signup, logout, refresh: loadStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="nav">
        <div className="brand">AnythingAqua</div>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/pricing">Pricing</Link>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/account">Account</Link>
              <button className="link" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Sign Up</Link>
            </>
          )}
        </nav>
      </header>
      <main className="content">{children}</main>
      <footer className="footer">Secure Jellyfin-powered streaming with Stripe subscriptions.</footer>
    </div>
  );
}

function HomePage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/api/public/media-stats').then((res) => setStats(res.data)).catch(() => setError('Media stats currently unavailable.'));
  }, []);
  return (
    <div className="hero">
      <div>
        <p className="badge">Stream safely with Jellyfin</p>
        <h1>Subscription media without the headaches.</h1>
        <p className="subtitle">Secure auth, automated Jellyfin provisioning, and Stripe-backed subscriptions.</p>
        <div className="actions">
          <Link className="btn" to="/pricing">Join / Subscribe</Link>
          <Link className="btn ghost" to="/login">Login</Link>
        </div>
        <div className="stats">
          <h3>We currently host:</h3>
          {stats ? (
            <ul>
              <li>{stats.movies} Movies</li>
              <li>{stats.tvShows} TV Shows</li>
              <li>{stats.episodes} Episodes</li>
            </ul>
          ) : (
            <p className="muted">{error || 'Loading stats...'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const startCheckout = async (tier) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    const res = await api.post('/api/subscription/checkout', { tier });
    window.location.href = res.data.url;
  };
  return (
    <div className="grid pricing">
      <TierCard title="Standard" price="$9.99" features={["Stream access", "No downloads"]} onSelect={() => startCheckout('standard')} />
      <TierCard title="Premium" price="$14.99" features={["Stream access", "Download enabled"]} onSelect={() => startCheckout('premium')} highlight />
    </div>
  );
}

function TierCard({ title, price, features, onSelect, highlight }) {
  return (
    <div className={`card ${highlight ? 'highlight' : ''}`}>
      <div className="card-header">
        <h3>{title}</h3>
        <p className="price">{price}/mo</p>
      </div>
      <ul className="feature-list">
        {features.map((f) => <li key={f}>{f}</li>)}
      </ul>
      <button className="btn full" onClick={onSelect}>Choose {title}</button>
    </div>
  );
}

function AuthPage({ mode }) {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password); else await signup(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth">
      <h2>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
      <p className="muted">Use a strong password (8+ characters).</p>
      <form onSubmit={submit} className="form">
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn full" disabled={loading}>{loading ? 'Working...' : mode === 'login' ? 'Login' : 'Create Account'}</button>
      </form>
    </div>
  );
}

function SuccessPage() {
  return (
    <div className="card">
      <h2>Checkout complete</h2>
      <p>Thanks for subscribing! Continue to onboarding to connect your Jellyfin account.</p>
      <Link className="btn" to="/onboarding/jellyfin">Go to Jellyfin onboarding</Link>
    </div>
  );
}

function CancelPage() {
  return (
    <div className="card">
      <h2>Checkout canceled</h2>
      <p>You can resume your purchase any time.</p>
      <Link className="btn" to="/pricing">Return to pricing</Link>
    </div>
  );
}

function OnboardingPage() {
  const { status, refresh } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (status && !status.tier) {
      navigate('/pricing');
    }
  }, [status, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await api.post('/api/jellyfin/provision', { username, password });
      setMessage(res.data.message);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Provisioning failed');
    }
  };

  return (
    <div className="card auth">
      <h2>Jellyfin onboarding</h2>
      <p className="muted">Create your Jellyfin credentials (stored only in Jellyfin).</p>
      <form onSubmit={submit} className="form">
        <label>Jellyfin username<input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} /></label>
        <label>Jellyfin password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button className="btn full">Create Jellyfin user</button>
      </form>
    </div>
  );
}

function DashboardPage() {
  const { status, loading } = useAuth();
  const [libraries, setLibraries] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!status?.tier) navigate('/pricing');
    }
  }, [status, loading, navigate]);

  const loadLibraries = async () => {
    setError('');
    try {
      const res = await api.get('/api/media/libraries');
      setLibraries(res.data.Items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load libraries');
    }
  };

  return (
    <div className="grid two">
      <div className="card">
        <h3>Subscription</h3>
        <p>Tier: {status?.tier || 'None'}</p>
        <p className="muted">Manage your subscription from the account page.</p>
      </div>
      <div className="card">
        <div className="space-between">
          <h3>Your libraries</h3>
          <button className="btn ghost" onClick={loadLibraries}>Refresh</button>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="grid media">
          {libraries.map((item) => (
            <div key={item.Id} className="tile">
              <div className="tile-title">{item.Name}</div>
              <div className="muted">{item.Type}</div>
            </div>
          ))}
          {libraries.length === 0 && <p className="muted">No libraries yet.</p>}
        </div>
      </div>
    </div>
  );
}

function AccountPage() {
  const { status } = useAuth();
  return (
    <div className="card">
      <h3>Account</h3>
      <p>Tier: {status?.tier || 'None'}</p>
      {status?.subscription && (
        <p className="muted">Next renewal: {new Date(status.subscription.currentPeriodEnd).toLocaleString()}</p>
      )}
      <p className="muted">For changes, update your subscription in Stripe.</p>
      <Link className="btn" to="/dashboard">Back to dashboard</Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/checkout/success" element={<SuccessPage />} />
            <Route path="/checkout/cancel" element={<CancelPage />} />
            <Route path="/onboarding/jellyfin" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
