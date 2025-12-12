import React, { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: true
});

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [tier, setTier] = useState('standard');
  const [status, setStatus] = useState(null);
  const [jellyfinUsername, setJellyfinUsername] = useState('');
  const [jellyfinPassword, setJellyfinPassword] = useState('');
  const [libraries, setLibraries] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async () => {
    try {
      setError('');
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await api.post(endpoint, { email, password });
      setUser(res.data.user);
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await api.get('/api/subscription/status');
      setStatus(res.data);
    } catch (err) {
      setStatus(null);
    }
  };

  const startCheckout = async () => {
    try {
      const res = await api.post('/api/subscription/checkout', { tier });
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    }
  };

  const provisionJellyfin = async () => {
    try {
      const res = await api.post('/api/jellyfin/provision', {
        username: jellyfinUsername,
        password: jellyfinPassword,
        tier
      });
      setMessage(res.data.message);
      fetchLibraries();
    } catch (err) {
      setError(err.response?.data?.message || 'Provisioning failed');
    }
  };

  const fetchLibraries = async () => {
    try {
      const res = await api.get('/api/media/libraries');
      setLibraries(res.data.Items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load libraries');
    }
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
    setStatus(null);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="container">
      <h1>AnythingAqua</h1>
      <div className="card">
        <h2>{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
        <div className="row">
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="row">
          <button onClick={handleAuth}>{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="secondary">
            Switch to {authMode === 'login' ? 'Sign Up' : 'Login'}
          </button>
          {user && <button onClick={logout} className="secondary">Logout</button>}
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Subscription</h2>
        <div className="row">
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
          <button onClick={startCheckout}>Checkout</button>
        </div>
        {status?.tier && <p>Current tier: {status.tier}</p>}
      </div>

      <div className="card">
        <h2>Provision Jellyfin</h2>
        <div className="row">
          <input placeholder="Jellyfin username" value={jellyfinUsername} onChange={(e) => setJellyfinUsername(e.target.value)} />
          <input type="password" placeholder="Jellyfin password" value={jellyfinPassword} onChange={(e) => setJellyfinPassword(e.target.value)} />
          <button onClick={provisionJellyfin}>Provision</button>
        </div>
        {message && <p>{message}</p>}
      </div>

      <div className="card">
        <h2>Libraries</h2>
        <button onClick={fetchLibraries}>Load Libraries</button>
        <div className="grid">
          {libraries.map((item) => (
            <div key={item.Id} className="tile">
              <h4>{item.Name}</h4>
              <p>{item.Type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
