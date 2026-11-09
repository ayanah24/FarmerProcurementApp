import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { db } from '../db/db';

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [prices, setPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    setLoadingPrices(true);
    try {
      // 1. Try loading from local Dexie DB
      const localPrices = await db.prices.toArray();
      if (localPrices.length > 0) {
        setPrices(localPrices);
      }

      // 2. If online, fetch latest and sync
      if (navigator.onLine) {
        const response = await api.get('/prices/today');
        setPrices(response.data);
        await db.prices.clear();
        await db.prices.bulkAdd(response.data);
      }
    } catch (err) {
      console.error('Failed to load prices:', err);
    } finally {
      setLoadingPrices(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>Farmer Registry</h2>
          <p style={{ margin: '0 0 1rem' }}>Register and manage farmer details.</p>
          <Link to="/farmers" style={{ color: '#aa3bff', fontWeight: 'bold', textDecoration: 'none' }}>Go to Registry →</Link>
        </div>

        <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>New Procurement</h2>
          <p style={{ margin: '0 0 1rem' }}>Record a new produce collection.</p>
          <Link to="/procurement" style={{ color: '#aa3bff', fontWeight: 'bold', textDecoration: 'none' }}>Start Entry →</Link>
        </div>

        {role === 'OFFICE_MANAGER' && (
          <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>Manager Tools</h2>
            <p style={{ margin: '0 0 1rem' }}>Verify bank details and manage prices.</p>
            <Link to="/manager" style={{ color: '#aa3bff', fontWeight: 'bold', textDecoration: 'none' }}>Open Tools →</Link>
          </div>
        )}
      </div>

      <section style={{ marginTop: '3rem', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Daily Prices (Today) - दर फलक</h3>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {loadingPrices ? (
          <p style={{ fontStyle: 'italic', color: '#666' }}>Fetching latest prices...</p>
        ) : prices.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: '#666' }}>No rates published for today yet. Office Manager can publish rates in Manager Tools.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #edf2f7' }}>
                <th style={{ padding: '0.75rem 1rem' }}>पीक (Crop)</th>
                <th style={{ padding: '0.75rem 1rem' }}>प्रत (Grade)</th>
                <th style={{ padding: '0.75rem 1rem' }}>दर / क्विंटल (Rate / Quintal)</th>
              </tr>
            </thead>
            <tbody>
              {prices.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{p.crop?.name || 'Crop'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: p.grade === 'A' ? '#ebf8ff' : p.grade === 'B' ? '#feebc8' : '#edf2f7',
                      color: p.grade === 'A' ? '#2b6cb0' : p.grade === 'B' ? '#c05621' : '#4a5568',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}>
                      Grade {p.grade}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#2f855a', fontWeight: 'bold' }}>₹{p.ratePerQuintal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
