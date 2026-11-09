import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { db } from '../db/db';

function Farmers() {
  const [farmers, setFarmers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: '',
    village: '',
    landArea: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const localFarmers = await db.farmers.toArray();
      setFarmers(localFarmers);

      if (navigator.onLine) {
        const response = await api.get('/farmers');
        setFarmers(response.data);
        await db.farmers.clear();
        await db.farmers.bulkAdd(response.data);
      }
    } catch (error) {
      console.error('Error loading farmers:', error);
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
    setSubmitting(true);
    try {
      const farmerPayload = {
        ...newFarmer,
        landArea: parseFloat(newFarmer.landArea)
      };

      if (navigator.onLine) {
        const response = await api.post('/farmers', farmerPayload);
        await db.farmers.add(response.data);
        setFarmers(prev => [...prev, response.data]);
      } else {
        const tempFarmer = {
          id: 'temp_' + Date.now(),
          farmerCode: 'TEMP-' + Math.floor(Math.random() * 100000),
          ...farmerPayload,
          isVerified: false,
          syncStatus: 'PENDING'
        };
        try {
          await db.farmers.add(tempFarmer);
          setFarmers(prev => [...prev, tempFarmer]);
          alert('ऑफलाइन मोड: शेतकरी नोंदणी स्थानिक साठवली गेली आहे. इंटरनेट सुरू झाल्यावर सिंक होईल.');
        } catch (dbErr) {
          console.error('Dexie Add Error:', dbErr);
          alert('स्थानिक डेटाबेस एरर: नोंदणी साठवता आली नाही.');
        }
      }

      setShowAddModal(false);
      setNewFarmer({ name: '', village: '', landArea: '', bankName: '', accountNumber: '', ifscCode: '' });
    } catch (error) {
      console.error('Failed to add farmer:', error);
      const errMsg = error.response?.data?.message;
      alert(typeof errMsg === 'string' ? errMsg : 'नोंदणी अयशस्वी. कृपया तपशील तपासा.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFarmers = farmers.filter(f =>
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.farmerCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.village || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="gov-container">
      {/* Page Title & Action Bar */}
      <div className="gov-card">
        <div className="gov-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0a3d62' }}>👨‍🌾 शेतकरी नोंदणी यादी (Farmer Registry)</h2>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              एकूण नोंदणीकृत शेतकरी: <strong>{farmers.length}</strong> | डीपी Browning (DPDP Act 2023) निकषानुसार सुरक्षित
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowAddModal(true)}
              className="gov-btn gov-btn-success"
              style={{ fontSize: '0.95rem', padding: '0.65rem 1.25rem' }}
            >
              + नवीन शेतकरी नोंदणी (Add New Farmer)
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="gov-card" style={{ padding: '0.75rem 1rem' }}>
        <input
          type="text"
          className="gov-input"
          placeholder="🔍 नाव, शेतकरी कोड (उदा. F-01001) किंवा गावाने शोधा... (Search Farmers)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Farmers Data Table */}
      <div className="gov-card">
        <div className="gov-card-body" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>माहिती लोड होत आहे...</p>
          ) : filteredFarmers.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0a3d62' }}>कोणतेही शेतकरी आढळले नाहीत</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>नवीन शेतकरी नोंदणी करण्यासाठी वरील बटणावर क्लिक करा.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="gov-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>शेतकरी कोड (Code)</th>
                    <th>शेतकऱ्याचे नाव (Farmer Name)</th>
                    <th>गाव (Village)</th>
                    <th>जमीन (Land Area)</th>
                    <th>बँक खाते क्रमांक (Bank Account)</th>
                    <th>बँक पडताळणी स्थिती (Bank Verification)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFarmers.map((farmer) => (
                    <tr key={farmer.id}>
                      <td style={{ fontWeight: 700, color: '#0a3d62', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {farmer.farmerCode}
                      </td>
                      <td style={{ fontWeight: 600 }}>{farmer.name}</td>
                      <td>{farmer.village}</td>
                      <td>{farmer.landArea} हेक्टर / एकर</td>
                      <td>
                        <span style={{ fontFamily: 'monospace' }}>
                          {farmer.bankName} - {farmer.accountNumber ? `••••${farmer.accountNumber.slice(-4)}` : 'N/A'}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>IFSC: {farmer.ifscCode}</div>
                      </td>
                      <td>
                        {farmer.isVerified ? (
                          <span className="gov-badge gov-badge-verified">
                            ✅ पडताळणी पूर्ण (Verified)
                          </span>
                        ) : (
                          <span className="gov-badge gov-badge-pending">
                            ⏳ पडताळणी बाकी (Pending)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Farmer Modal - Government Style */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(10, 61, 98, 0.65)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="gov-card" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div className="gov-card-header" style={{ backgroundColor: '#0a3d62', color: '#ffffff' }}>
              <h3 style={{ color: '#ffffff', margin: 0 }}>नवीन शेतकरी नोंदणी अर्ज (Farmer Registration)</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="gov-card-body">
              <div className="gov-alert-banner gov-alert-info" style={{ marginBottom: '1rem' }}>
                ℹ️ <strong>DPDP Act 2023 सूचना:</strong> आधार क्रमांक आवश्यक नाही. शेतकऱ्यास स्वयंचलित सुरक्षित शेतकरी कोड (F-XXXXX) दिला जाईल.
              </div>

              <form onSubmit={handleAddFarmer}>
                <div className="gov-form-group">
                  <label>शेतकऱ्याचे पूर्ण नाव / Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="gov-input"
                    placeholder="उदा. रमेश भास्कर पाटील"
                    value={newFarmer.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="gov-row-2col">
                  <div className="gov-form-group" style={{ flex: 1 }}>
                    <label>गाव / Village *</label>
                    <input
                      type="text"
                      name="village"
                      className="gov-input"
                      placeholder="उदा. दिंडोरी"
                      value={newFarmer.village}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="gov-form-group" style={{ flex: 1 }}>
                    <label>जमीन क्षेत्र (हेक्टर) / Land Area *</label>
                    <input
                      type="number"
                      step="0.1"
                      name="landArea"
                      className="gov-input"
                      placeholder="उदा. 4.5"
                      value={newFarmer.landArea}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="gov-form-group">
                  <label>बँकेचे नाव / Bank Name *</label>
                  <input
                    type="text"
                    name="bankName"
                    className="gov-input"
                    placeholder="उदा. State Bank of India / HDFC Bank"
                    value={newFarmer.bankName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="gov-row-2col">
                  <div className="gov-form-group" style={{ flex: 1 }}>
                    <label>बँक खाते क्रमांक / Account Number *</label>
                    <input
                      type="text"
                      name="accountNumber"
                      className="gov-input"
                      placeholder="उदा. 34982749283"
                      value={newFarmer.accountNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="gov-form-group" style={{ flex: 1 }}>
                    <label>IFSC कोड / IFSC Code *</label>
                    <input
                      type="text"
                      name="ifscCode"
                      className="gov-input"
                      placeholder="उदा. SBIN0001234"
                      value={newFarmer.ifscCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="gov-btn gov-btn-secondary"
                  >
                    रद्द करा (Cancel)
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="gov-btn gov-btn-success"
                  >
                    {submitting ? 'नोंदणी होत आहे...' : 'जतन करा (Save Farmer)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Farmers;
