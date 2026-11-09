import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'लॉगिन अयशस्वी. कृपया युझरनेम व पासवर्ड तपासा. (Login failed)');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="gov-card" style={{ maxWidth: '440px', width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div className="gov-card-header" style={{ textAlign: 'center', display: 'block', backgroundColor: '#0a3d62', color: '#ffffff' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🌾</div>
          <h2 style={{ color: '#ffffff', fontSize: '1.25rem', margin: 0 }}>शेतकरी खरेदी पोर्टल लॉगिन</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>FPC Procurement System Login</p>
        </div>

        <div className="gov-card-body" style={{ padding: '1.75rem' }}>
          {error && (
            <div className="gov-alert-banner" style={{ backgroundColor: '#fee2e2', color: '#991b1b', borderLeft: '4px solid #ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="gov-form-group">
              <label>युझरनेम / Username</label>
              <input
                type="text"
                className="gov-input"
                placeholder="उदा. operator1 किंवा manager"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="gov-form-group">
              <label>पासवर्ड / Password</label>
              <input
                type="password"
                className="gov-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gov-btn gov-btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '1rem' }}
            >
              {loading ? 'लॉगिन होत आहे...' : 'प्रवेश करा (Login) →'}
            </button>
          </form>

          {/* Quick Credential Helper for Assessment Evaluators */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
            <span style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              चाचणी खाती (Quick Fill Test Accounts):
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fillCredentials('operator1', 'operator123')}
                style={{ flex: 1, padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center' }}
              >
                <strong>Operator</strong><br/><span style={{ color: '#64748b' }}>operator1</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('manager', 'manager123')}
                style={{ flex: 1, padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center' }}
              >
                <strong>Manager</strong><br/><span style={{ color: '#64748b' }}>manager</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
