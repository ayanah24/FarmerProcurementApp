import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { db } from '../db/db';

function Dashboard() {
  const role = localStorage.getItem('role');
  const [prices, setPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [farmerCount, setFarmerCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoadingPrices(true);
    try {
      // Load local Dexie data first
      const localPrices = await db.prices.toArray();
      if (localPrices.length > 0) setPrices(localPrices);

      const localFarmers = await db.farmers.toArray();
      setFarmerCount(localFarmers.length);

      // Fetch fresh data if online
      if (navigator.onLine) {
        const [pricesRes, farmersRes] = await Promise.all([
          api.get('/prices/today'),
          api.get('/farmers')
        ]);
        setPrices(pricesRes.data);
        setFarmerCount(farmersRes.data.length);
        await db.prices.clear();
        await db.prices.bulkAdd(pricesRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingPrices(false);
    }
  };

  const isManager = role === 'OFFICE_MANAGER';

  return (
    <div className="gov-container">
      {/* Welcome Banner */}
      <div className="gov-card" style={{ borderLeft: '5px solid #0a3d62', background: '#ffffff' }}>
        <div className="gov-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', color: '#0a3d62' }}>
              स्वागत आहे! {isManager ? 'कार्यालय व्यवस्थापक (Office Manager)' : 'संकलन केंद्र चालक (Center Operator)'}
            </h2>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
              शेतकरी धान्य संकलन व थेट बँक खात्यात रक्कम जमा प्रणाली (FPC Direct Payment Portal)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <span className="gov-badge gov-badge-verified">
              🟢 प्रणाली कार्यरत (System Online)
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Modules Grid */}
      <div className="gov-grid" style={{ marginBottom: '1.5rem' }}>
        {/* Module 1: Farmer Registry */}
        <div className="gov-card" style={{ borderTop: '3px solid #1e5f8a' }}>
          <div className="gov-card-body">
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>👨‍🌾</div>
            <h3 style={{ margin: '0 0 0.4rem 0', color: '#0a3d62' }}>शेतकरी नोंदणी (Farmer Registry)</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              नवीन शेतकऱ्यांची नोंदणी, बँक खाते तपशील व पडताळणी स्थिती व्यवस्थापन.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#0a3d62', fontWeight: 600 }}>
                नोंदणीकृत: {farmerCount} शेतकरी
              </span>
              <Link to="/farmers" className="gov-btn gov-btn-secondary" style={{ padding: '0.45rem 0.9rem' }}>
                नोंदणी पहा →
              </Link>
            </div>
          </div>
        </div>

        {/* Module 2: New Procurement Entry */}
        <div className="gov-card" style={{ borderTop: '3px solid #1b5e20' }}>
          <div className="gov-card-body">
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>⚖️</div>
            <h3 style={{ margin: '0 0 0.4rem 0', color: '#1b5e20' }}>नवीन धान्य खरेदी (New Procurement)</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              धान्य वजन नोंद, स्वयंचलित ओलावा कपात व थेट खरेदी पावती निर्मिती.
            </p>
            <div style={{ textAlign: 'right' }}>
              <Link to="/procurement" className="gov-btn gov-btn-success" style={{ padding: '0.45rem 1rem' }}>
                + खरेदी नोंद सुरू करा
              </Link>
            </div>
          </div>
        </div>

        {/* Module 3: Office Manager Tools */}
        {isManager && (
          <div className="gov-card" style={{ borderTop: '3px solid #e65100' }}>
            <div className="gov-card-body">
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🏛️</div>
              <h3 style={{ margin: '0 0 0.4rem 0', color: '#e65100' }}>व्यवस्थापक कक्ष (Manager Tools)</h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                बँक तपशील पडताळणी, दर फलक निश्चिती, AI संशयास्पद नोंदी व पेमेंट मंजुरी.
              </p>
              <div style={{ textAlign: 'right' }}>
                <Link to="/manager" className="gov-btn gov-btn-primary" style={{ padding: '0.45rem 1rem' }}>
                  व्यवस्थापक कक्ष उघडा →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Centralized Price Board Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div>
            <h3>दैनिक दर फलक (Centralized Daily Price Board)</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              तारीख: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          {isManager && (
            <Link to="/manager" className="gov-btn gov-btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              दर बदला (Update Rates)
            </Link>
          )}
        </div>

        <div className="gov-card-body" style={{ padding: 0 }}>
          {loadingPrices ? (
            <p style={{ padding: '1.5rem', color: '#64748b', margin: 0 }}>दर माहिती लोड होत आहे...</p>
          ) : prices.length === 0 ? (
            <p style={{ padding: '1.5rem', color: '#64748b', margin: 0 }}>
              आजचे दर अद्याप प्रसिद्ध केलेले नाहीत. मुख्य कार्यालयातून दर निश्चित केले जातील.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="gov-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>अ.क्र. (Sr.)</th>
                    <th>पीक (Crop)</th>
                    <th>प्रत (Grade)</th>
                    <th>अधिकृत दर / क्विंटल (Official Rate / Qtl)</th>
                    <th>दर / किलो (Rate / Kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((p, idx) => (
                    <tr key={p.id}>
                      <td style={{ width: '60px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: '#0a3d62' }}>{p.crop?.name || 'Crop'}</td>
                      <td>
                        <span className="gov-badge" style={{
                          backgroundColor: p.grade === 'A' ? '#e0f2fe' : p.grade === 'B' ? '#fef3c7' : '#f1f5f9',
                          color: p.grade === 'A' ? '#0369a1' : p.grade === 'B' ? '#92400e' : '#475569',
                          border: '1px solid rgba(0,0,0,0.1)'
                        }}>
                          Grade {p.grade}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#1b5e20', fontSize: '1rem' }}>
                        ₹{Number(p.ratePerQuintal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: '#475569' }}>
                        ₹{(Number(p.ratePerQuintal) / 100).toFixed(2)} / kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
