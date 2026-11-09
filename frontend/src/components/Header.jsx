import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  if (!token) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const isManager = role === 'OFFICE_MANAGER';

  return (
    <header>
      {/* Indian Tricolor Strip */}
      <div className="gov-tricolor"></div>

      {/* Main Government Banner */}
      <div className="gov-header">
        <div className="gov-header-inner">
          <div className="gov-title-group">
            <div className="gov-emblem" aria-hidden="true">🌾</div>
            <div className="gov-header-text">
              <h1>शेतकरी उत्पादक कंपनी खरेदी व संकलन पोर्टल</h1>
              <p>Farmer Producer Company (FPC) Procurement & Payment System</p>
            </div>
          </div>
          <div className="gov-user-pill">
            <span style={{ color: '#0a3d62', fontWeight: 600 }}>
              {isManager ? '🏛️ कार्यालय व्यवस्थापक (Office Manager)' : '🏢 संकलन केंद्र चालक (Center Operator)'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="gov-nav">
        <div className="gov-nav-inner">
          <div className="gov-nav-links">
            <Link
              to="/dashboard"
              className={`gov-nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              🏠 मुख्यपृष्ठ (Dashboard)
            </Link>
            <Link
              to="/farmers"
              className={`gov-nav-link ${location.pathname === '/farmers' ? 'active' : ''}`}
            >
              👨‍🌾 शेतकरी नोंदणी (Farmers)
            </Link>
            <Link
              to="/procurement"
              className={`gov-nav-link ${location.pathname === '/procurement' ? 'active' : ''}`}
            >
              ⚖️ नवीन खरेदी (New Procurement)
            </Link>
            {isManager && (
              <Link
                to="/manager"
                className={`gov-nav-link ${location.pathname === '/manager' ? 'active' : ''}`}
              >
                ⚙️ व्यवस्थापक कक्ष (Manager Tools)
              </Link>
            )}
          </div>
          <div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              🚪 बाहेर पडा (Logout)
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;

