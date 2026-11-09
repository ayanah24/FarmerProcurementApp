import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { db } from '../db/db';

function Farmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: '',
    village: '',
    landArea: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  // Load farmers from local Dexie DB, or fetch from API if online
  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    setLoading(true);
    try {
      // First try loading from local Dexie storage
      const localFarmers = await db.farmers.toArray();
      setFarmers(localFarmers);

      // If online, fetch fresh list from backend and update Dexie
      if (navigator.onLine) {
        const response = await api.get('/farmers');
        setFarmers(response.data);

        // Clear and bulk add to sync local cache
        await db.farmers.clear();
        await db.farmers.bulkAdd(response.data);
      }
    } catch (error) {
      console.error("Error loading farmers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFarmer(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFarmer = async (e) => {
    e.preventDefault();
    try {
      const farmerPayload = {
        ...newFarmer,
        landArea: parseFloat(newFarmer.landArea)
      };

      if (navigator.onLine) {
        // Send directly to backend
        const response = await api.post('/farmers', farmerPayload);
        // Save returned farmer (with backend-generated ID/code) to Dexie
        await db.farmers.add(response.data);
        setFarmers(prev => [...prev, response.data]);
      } else {
        // Generate temporary local farmer record
        const tempFarmer = {
          id: 'temp_' + Date.now(),
          farmerCode: 'TEMP-' + Math.floor(Math.random() * 1000),
          ...farmerPayload,
          isVerified: false,
          syncStatus: 'PENDING'
        };
        await db.farmers.add(tempFarmer);
        setFarmers(prev => [...prev, tempFarmer]);
        alert("Offline mode: Farmer saved locally. Will sync when online.");
      }

      setShowAddModal(false);
      setNewFarmer({ name: '', village: '', landArea: '', bankName: '', accountNumber: '', ifscCode: '' });
    } catch (error) {
      console.error("Failed to add farmer:", error);
      const errMsg = error.response?.data?.message;
      alert(typeof errMsg === 'string' ? errMsg : "Failed to add farmer. Check details.");
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button onClick={() => navigate('/dashboard')} style={{ marginRight: '1rem', cursor: 'pointer' }}>
            ← Back to Dashboard
          </button>
          <h1 style={{ display: 'inline' }}>Farmer Registry</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#aa3bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Add New Farmer
        </button>
      </header>

      {/* Add Farmer Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '400px', color: '#333' }}>
            <h2>Register New Farmer</h2>
            <form onSubmit={handleAddFarmer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <input type="text" name="name" placeholder="Full Name" value={newFarmer.name} onChange={handleInputChange} required style={{ padding: '0.5rem' }} />
              <input type="text" name="village" placeholder="Village" value={newFarmer.village} onChange={handleInputChange} required style={{ padding: '0.5rem' }} />
              <input type="number" step="0.1" name="landArea" placeholder="Land Area (Acres/Hectares)" value={newFarmer.landArea} onChange={handleInputChange} required style={{ padding: '0.5rem' }} />
              <input type="text" name="bankName" placeholder="Bank Name" value={newFarmer.bankName} onChange={handleInputChange} required style={{ padding: '0.5rem' }} />
              <input type="text" name="accountNumber" placeholder="Account Number" value={newFarmer.accountNumber} onChange={handleInputChange} required style={{ padding: '0.5rem' }} />
              <input type="text" name="ifscCode" placeholder="IFSC Code" value={newFarmer.ifscCode} onChange={handleInputChange} required style={{ padding: '0.5rem' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#aa3bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Farmer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Farmers List */}
      {loading ? (
        <p>Loading farmers...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '0.75rem' }}>Farmer Code</th>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>Village</th>
              <th style={{ padding: '0.75rem' }}>Land Area</th>
              <th style={{ padding: '0.75rem' }}>Bank Status</th>
            </tr>
          </thead>
          <tbody>
            {farmers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No farmers registered yet.</td>
              </tr>
            ) : (
              farmers.map((farmer) => (
                <tr key={farmer.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{farmer.farmerCode}</td>
                  <td style={{ padding: '0.75rem' }}>{farmer.name}</td>
                  <td style={{ padding: '0.75rem' }}>{farmer.village}</td>
                  <td style={{ padding: '0.75rem' }}>{farmer.landArea}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: farmer.isVerified ? '#e6fffa' : '#fff5f5',
                      color: farmer.isVerified ? '#319795' : '#e53e3e',
                      fontSize: '0.85rem'
                    }}>
                      {farmer.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Farmers;
