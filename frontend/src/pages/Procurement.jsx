import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { db } from '../db/db';

function Procurement() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [crops, setCrops] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    farmerId: '',
    cropId: '',
    grade: 'A',
    grossWeight: '',
    tareWeight: '',
    moisture: '12.0',
  });

  // Load initial data for the form
  useEffect(() => {
    const initForm = async () => {
      try {
        // Load farmers and crops from local DB (updated by sync or previous page visits)
        let localFarmers = await db.farmers.toArray();
        setFarmers(localFarmers);

        // Fetch fresh farmers, crops and today's prices if online
        if (navigator.onLine) {
          const [farmersRes, cropsRes, pricesRes] = await Promise.all([
            api.get('/farmers'),
            api.get('/prices/crops'),
            api.get('/prices/today')
          ]);
          setFarmers(farmersRes.data);
          await db.farmers.clear();
          await db.farmers.bulkAdd(farmersRes.data);

          setCrops(cropsRes.data);
          setPrices(pricesRes.data);

          // Cache prices in Dexie
          await db.prices.clear();
          await db.prices.bulkAdd(pricesRes.data);
        } else {
          const localPrices = await db.prices.toArray();
          setPrices(localPrices);
          // For crops, we'd ideally have them cached too. Placeholder if not:
          setCrops([{ id: 'default-soybean', name: 'Soybean' }]);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };
    initForm();
  }, []);

  // Real-time calculations based on strategy.md
  const calculations = useMemo(() => {
    const gross = parseFloat(formData.grossWeight) || 0;
    const tare = parseFloat(formData.tareWeight) || 0;
    const moisture = parseFloat(formData.moisture) || 12;

    const netWeight = Math.max(0, gross - tare);

    // Moisture Deduction: If moisture > 12%, net weight = (gross - tare) * (1 - (moisture - 12)/100)
    let finalWeight = netWeight;
    if (moisture > 12) {
      const deductionFactor = (moisture - 12) / 100;
      finalWeight = netWeight * (1 - deductionFactor);
    }

    // Find applicable rate
    const priceObj = prices.find(p => p.cropId === formData.cropId && p.grade === formData.grade);
    const rate = priceObj ? parseFloat(priceObj.ratePerQuintal) : 0;

    // Rate is per Quintal (100kg)
    const totalAmount = (finalWeight / 100) * rate;

    return {
      netWeight: netWeight.toFixed(1),
      finalWeight: finalWeight.toFixed(1),
      rate: rate.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    };
  }, [formData, prices]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.farmerId || !formData.cropId) {
      alert("Please select farmer and crop.");
      return;
    }

    const selectedFarmer = farmers.find(f => f.id === formData.farmerId);
    if (selectedFarmer && !selectedFarmer.isVerified) {
      alert("Cannot record procurement: Farmer bank details are pending verification by Office Manager.");
      return;
    }

    const procurementRecord = {
      id: crypto.randomUUID(),
      slipNo: `SLIP-${Date.now().toString().slice(-6)}`,
      farmerId: formData.farmerId,
      cropId: formData.cropId,
      grade: formData.grade,
      grossWeight: parseFloat(formData.grossWeight),
      tareWeight: parseFloat(formData.tareWeight),
      moisture: parseFloat(formData.moisture),
      netWeight: parseFloat(calculations.finalWeight),   // moisture-adjusted final weight
      rateApplied: parseFloat(calculations.rate),
      totalAmount: parseFloat(calculations.totalAmount),
      localTimestamp: new Date().toISOString(),
      syncStatus: 'PENDING'
    };

    try {
      // Save to local Dexie buffer immediately
      await db.procurements.add(procurementRecord);

      if (navigator.onLine) {
        try {
          await api.post('/procurements', procurementRecord);
          await db.procurements.update(procurementRecord.id, { syncStatus: 'SYNCED' });
        } catch (syncErr) {
          console.warn("Direct sync failed, keeping in local buffer:", syncErr);
        }
      }

      alert(`Success! Slip No: ${procurementRecord.slipNo}\nFinal Weight: ${calculations.finalWeight}kg\nAmount: ₹${calculations.totalAmount}`);
      navigate('/dashboard');
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to save procurement.");
    }
  };

  if (loading) return <p>Loading form...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '1rem', cursor: 'pointer' }}>
        ← Back
      </button>

      <h1 style={{ marginBottom: '0.5rem' }}>नवीन खरेदी (New Procurement)</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Record produce collection details below.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>शेतकरी (Farmer)</label>
          <select name="farmerId" value={formData.farmerId} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem' }}>
            <option value="">Select Farmer</option>
            {farmers.map(f => (
              <option key={f.id} value={f.id} disabled={!f.isVerified}>
                {f.name} ({f.farmerCode}) {!f.isVerified ? ' - ⚠️ (Bank Verification Pending - Not Selectable)' : ' - ✅ (Verified)'}
              </option>
            ))}
          </select>
          {farmers.length === 0 ? (
            <p style={{ color: '#e53e3e', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              No farmers found in registry. Please register a farmer first.
            </p>
          ) : (
            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Only farmers with verified bank details can be selected for procurement.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>पीक (Crop)</label>
            <select name="cropId" value={formData.cropId} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem' }}>
              <option value="">Select Crop</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>प्रत (Grade)</label>
            <select name="grade" value={formData.grade} onChange={handleChange} style={{ width: '100%', padding: '0.75rem' }}>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>एकूण वजन (Gross kg)</label>
            <input type="number" step="0.1" name="grossWeight" value={formData.grossWeight} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>पोत्याचे वजन (Tare kg)</label>
            <input type="number" step="0.1" name="tareWeight" value={formData.tareWeight} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>ओलावा (Moisture %)</label>
          <input type="number" step="0.1" name="moisture" value={formData.moisture} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem' }} />
          {parseFloat(formData.moisture) > 12 && <p style={{ fontSize: '0.85rem', color: '#e53e3e', marginTop: '0.25rem' }}>Note: Moisture &gt; 12% will result in weight deduction.</p>}
        </div>

        {/* Calculation Summary Box */}
        <div style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee', marginTop: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Calculation Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
            <span>Net Weight:</span> <span style={{ fontWeight: 'bold' }}>{calculations.netWeight} kg</span>
            <span>Final Weight (Deducted):</span> <span style={{ fontWeight: 'bold', color: '#2b6cb0' }}>{calculations.finalWeight} kg</span>
            <span>Rate Applied:</span> <span style={{ fontWeight: 'bold' }}>₹{calculations.rate}/quintal</span>
            <span style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>Total Amount:</span>
            <span style={{ fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: 'bold', color: '#2f855a' }}>₹{calculations.totalAmount}</span>
          </div>
        </div>

        <button type="submit" style={{ padding: '1rem', backgroundColor: '#aa3bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', marginTop: '1rem' }}>
          खरेदी जतन करा (Save Procurement)
        </button>
      </form>
    </div>
  );
}

export default Procurement;
