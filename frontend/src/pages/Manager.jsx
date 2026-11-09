import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Manager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('verification');

  // Data States
  const [unverifiedFarmers, setUnverifiedFarmers] = useState([]);
  const [flaggedProcurements, setFlaggedProcurements] = useState([]);
  const [crops, setCrops] = useState([]);

  // Price Form State
  const [priceForm, setPriceForm] = useState({
    cropId: '',
    grade: 'A',
    ratePerQuintal: ''
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'verification') {
        const res = await api.get('/farmers?unverified=true');
        setUnverifiedFarmers(res.data.filter(f => !f.isVerified));
      } else if (activeTab === 'prices') {
        const cropsRes = await api.get('/prices/crops');
        setCrops(cropsRes.data);
      } else if (activeTab === 'anomalies') {
        const res = await api.get('/procurements');
        // Filter AI-flagged entries client-side (backend returns all, flagged included)
        setFlaggedProcurements(res.data.filter(p => p.aiFlagged));
      }
    } catch (err) {
      console.error("Error fetching manager data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBank = async (farmerId) => {
    try {
      await api.patch(`/farmers/${farmerId}/verify`);
      setUnverifiedFarmers(prev => prev.filter(f => f.id !== farmerId));
      alert("Farmer bank details verified successfully.");
    } catch (err) {
      console.error("Verification failed:", err);
      alert("Failed to verify bank details.");
    }
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/prices', priceForm);
      alert("Daily price set successfully!");
      setPriceForm({ cropId: '', grade: 'A', ratePerQuintal: '' });
    } catch (err) {
      console.error("Failed to set price:", err);
      alert("Failed to update price board.");
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '1rem', cursor: 'pointer' }}>
        ← Back to Dashboard
      </button>

      <h1>Office Manager Control Panel</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Verify records, set market prices, and review operational alerts.</p>

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #eee', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('verification')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderBottom: activeTab === 'verification' ? '3px solid #aa3bff' : 'none',
            fontWeight: activeTab === 'verification' ? 'bold' : 'normal',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          Bank Verification
        </button>
        <button
          onClick={() => setActiveTab('prices')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderBottom: activeTab === 'prices' ? '3px solid #aa3bff' : 'none',
            fontWeight: activeTab === 'prices' ? 'bold' : 'normal',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          Daily Price Board
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderBottom: activeTab === 'anomalies' ? '3px solid #aa3bff' : 'none',
            fontWeight: activeTab === 'anomalies' ? 'bold' : 'normal',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          AI Anomaly Flagged
        </button>
      </div>

      {/* Tab 1: Bank Verification */}
      {activeTab === 'verification' && (
        <div>
          <h2>Pending Farmer Bank Verifications</h2>
          {loading ? <p>Loading...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Bank</th>
                  <th style={{ padding: '0.75rem' }}>Account No</th>
                  <th style={{ padding: '0.75rem' }}>IFSC</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {unverifiedFarmers.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No pending verifications.</td></tr>
                ) : (
                  unverifiedFarmers.map(farmer => (
                    <tr key={farmer.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{farmer.name}</td>
                      <td style={{ padding: '0.75rem' }}>{farmer.bankName}</td>
                      <td style={{ padding: '0.75rem' }}>{farmer.accountNumber}</td>
                      <td style={{ padding: '0.75rem' }}>{farmer.ifscCode}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => handleVerifyBank(farmer.id)}
                          style={{ padding: '0.4rem 0.8rem', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Approve Bank Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Daily Price Board */}
      {activeTab === 'prices' && (
        <div style={{ maxWidth: '500px' }}>
          <h2>Set Centralized Daily Rate</h2>
          <form onSubmit={handlePriceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Crop</label>
              <select
                value={priceForm.cropId}
                onChange={e => setPriceForm({ ...priceForm, cropId: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem' }}
              >
                <option value="">Select Crop</option>
                {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Grade</label>
              <select
                value={priceForm.grade}
                onChange={e => setPriceForm({ ...priceForm, grade: e.target.value })}
                style={{ width: '100%', padding: '0.75rem' }}
              >
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Rate Per Quintal (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 4800.00"
                value={priceForm.ratePerQuintal}
                onChange={e => setPriceForm({ ...priceForm, ratePerQuintal: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem' }}
              />
            </div>

            <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#aa3bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Publish Rate to Collection Centers
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: AI Anomalies */}
      {activeTab === 'anomalies' && (
        <div>
          <h2>AI Flagged Suspicious Entries</h2>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Entries flagged for high moisture, excessive weight vs land area, or duplicate timestamp activity.</p>
          {loading ? <p>Loading...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Slip No</th>
                  <th style={{ padding: '0.75rem' }}>Farmer</th>
                  <th style={{ padding: '0.75rem' }}>Net Weight</th>
                  <th style={{ padding: '0.75rem' }}>Flag Reason</th>
                </tr>
              </thead>
              <tbody>
                {flaggedProcurements.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No anomalies detected. Operations normal.</td></tr>
                ) : (
                  flaggedProcurements.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{item.slipNo}</td>
                      <td style={{ padding: '0.75rem' }}>{item.farmer?.name || item.farmerId}</td>
                      <td style={{ padding: '0.75rem' }}>{item.netWeight} kg</td>
                      <td style={{ padding: '0.75rem', color: '#e53e3e', fontWeight: 'bold' }}>{item.aiFlagReason || 'High Yield Anomaly'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Manager;
