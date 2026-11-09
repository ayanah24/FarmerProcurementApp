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
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    farmerId: '',
    cropId: '',
    grade: 'A',
    grossWeight: '',
    tareWeight: '',
    moisture: '12.0',
  });

  useEffect(() => {
    const initForm = async () => {
      try {
        const localFarmers = await db.farmers.toArray();
        setFarmers(localFarmers);

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

          await db.prices.clear();
          await db.prices.bulkAdd(pricesRes.data);
        } else {
          const localPrices = await db.prices.toArray();
          setPrices(localPrices);
          setCrops([{ id: 'default-soybean', name: 'Soybean' }]);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    };
    initForm();
  }, []);

  // Real-time calculations: Moisture deduction logic (1% deduction per % above 12%)
  const calculations = useMemo(() => {
    const gross = parseFloat(formData.grossWeight) || 0;
    const tare = parseFloat(formData.tareWeight) || 0;
    const moisture = parseFloat(formData.moisture) || 12;

    const netWeight = Math.max(0, gross - tare);

    let deductionPercent = 0;
    let finalWeight = netWeight;
    if (moisture > 12) {
      deductionPercent = moisture - 12;
      finalWeight = netWeight * (1 - deductionPercent / 100);
    }

    const priceObj = prices.find(p => p.cropId === formData.cropId && p.grade === formData.grade);
    const rate = priceObj ? parseFloat(priceObj.ratePerQuintal) : 0;

    // Rate is per quintal (100 kg)
    const totalAmount = (finalWeight / 100) * rate;

    return {
      netWeight: netWeight.toFixed(1),
      finalWeight: finalWeight.toFixed(1),
      deductionPercent: deductionPercent.toFixed(1),
      rate: rate.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    };
  }, [formData, prices]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectedFarmer = farmers.find(f => f.id === formData.farmerId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.farmerId || !formData.cropId) {
      alert('कृपया शेतकरी व पीक निवडा. (Please select farmer and crop)');
      return;
    }

    if (selectedFarmer && !selectedFarmer.isVerified) {
      alert('खरेदी नोंद अशक्य: या शेतकऱ्याचे बँक खाते अद्याप मुख्य कार्यालयाकडून पडताळले गेलेले नाही.');
      return;
    }

    setSubmitting(true);
    const procurementRecord = {
      id: crypto.randomUUID(),
      slipNo: `SLIP-${Date.now().toString().slice(-6)}`,
      farmerId: formData.farmerId,
      cropId: formData.cropId,
      grade: formData.grade,
      grossWeight: parseFloat(formData.grossWeight),
      tareWeight: parseFloat(formData.tareWeight),
      moisture: parseFloat(formData.moisture),
      netWeight: parseFloat(calculations.finalWeight),
      rateApplied: parseFloat(calculations.rate),
      totalAmount: parseFloat(calculations.totalAmount),
      localTimestamp: new Date().toISOString(),
      syncStatus: 'PENDING'
    };

    try {
      await db.procurements.add(procurementRecord);

      if (navigator.onLine) {
        try {
          await api.post('/procurements', procurementRecord);
          await db.procurements.update(procurementRecord.id, { syncStatus: 'SYNCED' });
        } catch (syncErr) {
          console.warn('Direct sync failed, keeping in local buffer:', syncErr);
        }
      }

      alert(`✅ खरेदी पावती यशस्वीरीत्या जतन केली!\nपावती क्र: ${procurementRecord.slipNo}\nअंतिम वजन: ${calculations.finalWeight} kg\nएकूण देय रक्कम: ₹${calculations.totalAmount}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Submission error:', err);
      alert('खरेदी जतन करणे अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="gov-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>खरेदी फॉर्म लोड होत आहे...</p>
      </div>
    );
  }

  return (
    <div className="gov-container" style={{ maxWidth: '780px' }}>
      <div className="gov-card">
        <div className="gov-card-header" style={{ backgroundColor: '#0a3d62', color: '#ffffff' }}>
          <div>
            <h2 style={{ color: '#ffffff', margin: 0, fontSize: '1.25rem' }}>
              ⚖️ नवीन धान्य खरेदी नोंद पावती (Produce Procurement Weighment Slip)
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: '#cbd5e1', fontSize: '0.85rem' }}>
              संकलन केंद्र वजन व ओलावा तपासणी फॉर्म
            </p>
          </div>
        </div>

        <div className="gov-card-body">
          <form onSubmit={handleSubmit}>
            {/* Farmer Selection */}
            <div className="gov-form-group">
              <label>शेतकरी निवडा / Select Farmer *</label>
              <select
                name="farmerId"
                className="gov-select"
                value={formData.farmerId}
                onChange={handleChange}
                required
              >
                <option value="">-- शेतकरी निवडा (Select Farmer) --</option>
                {farmers.map(f => (
                  <option key={f.id} value={f.id} disabled={!f.isVerified}>
                    {f.name} ({f.farmerCode}) - {f.village} {!f.isVerified ? '⚠️ [बँक पडताळणी प्रलंबित - निवडता येत नाही]' : '✅ [पडताळणी पूर्ण]'}
                  </option>
                ))}
              </select>
              {farmers.length === 0 ? (
                <p style={{ color: '#b71c1c', fontSize: '0.82rem', marginTop: '0.35rem' }}>
                  नोंदणीकृत शेतकरी आढळले नाहीत. प्रथम "शेतकरी नोंदणी" मधून शेतकरी जोडा.
                </p>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  ℹ️ केवळ बँक खाते पडताळणी पूर्ण झालेले शेतकरीच खरेदीसाठी निवडता येतील.
                </p>
              )}
            </div>

            {/* Crop & Grade Row */}
            <div className="gov-row-2col">
              <div className="gov-form-group" style={{ flex: 1 }}>
                <label>पीक / Crop *</label>
                <select
                  name="cropId"
                  className="gov-select"
                  value={formData.cropId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- पीक निवडा --</option>
                  {crops.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="gov-form-group" style={{ flex: 1 }}>
                <label>प्रत / Quality Grade *</label>
                <select
                  name="grade"
                  className="gov-select"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                >
                  <option value="A">Grade A (उत्कृष्ट)</option>
                  <option value="B">Grade B (मध्यम)</option>
                  <option value="C">Grade C (साधारण)</option>
                </select>
              </div>
            </div>

            {/* Weights Row */}
            <div className="gov-row-2col">
              <div className="gov-form-group" style={{ flex: 1 }}>
                <label>एकूण वजन / Gross Weight (Kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  name="grossWeight"
                  className="gov-input"
                  placeholder="उदा. 1250.0"
                  value={formData.grossWeight}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="gov-form-group" style={{ flex: 1 }}>
                <label>पोत्याचे वजन / Tare Weight (Kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  name="tareWeight"
                  className="gov-input"
                  placeholder="उदा. 25.0"
                  value={formData.tareWeight}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Moisture Content */}
            <div className="gov-form-group">
              <label>धान्य ओलावा / Moisture Content (%) *</label>
              <input
                type="number"
                step="0.1"
                name="moisture"
                className="gov-input"
                placeholder="मानक मर्यादा: 12.0%"
                value={formData.moisture}
                onChange={handleChange}
                required
              />
              {parseFloat(formData.moisture) > 12 && (
                <p style={{ color: '#b71c1c', fontSize: '0.85rem', marginTop: '0.35rem', fontWeight: 600 }}>
                  ⚠️ ओलावा १२% पेक्षा जास्त आहे ({formData.moisture}%). {calculations.deductionPercent}% वजन कपात लागू झाली आहे.
                </p>
              )}
            </div>

            {/* Government Official Calculation Summary Box */}
            <div className="gov-summary-box">
              <div style={{ fontWeight: 700, color: '#0a3d62', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                📊 पावती हिशोब तपशील (Procurement Calculation Summary)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span>काटे वजन (Net Weight):</span>
                <span style={{ fontWeight: 600 }}>{calculations.netWeight} kg</span>

                <span>ओलावा कपात टक्केवारी:</span>
                <span style={{ color: parseFloat(formData.moisture) > 12 ? '#b71c1c' : '#1b5e20', fontWeight: 600 }}>
                  {parseFloat(formData.moisture) > 12 ? `-${calculations.deductionPercent}%` : '०% (मानक मर्यादेत)'}
                </span>

                <span>अंतिम देय वजन (Final Weight):</span>
                <span style={{ fontWeight: 700, color: '#0a3d62' }}>{calculations.finalWeight} kg</span>

                <span>लागू अधिकृत दर (Applied Rate):</span>
                <span style={{ fontWeight: 600 }}>₹{calculations.rate} / क्विंटल</span>

                <div style={{ gridColumn: 'span 2', height: '1px', background: '#cbd5e1', margin: '0.35rem 0' }}></div>

                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0a3d62' }}>एकूण देय रक्कम (Total Amount):</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1b5e20' }}>₹{calculations.totalAmount}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="gov-btn gov-btn-secondary"
              >
                रद्द करा (Cancel)
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="gov-btn gov-btn-success"
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
              >
                {submitting ? 'जतन होत आहे...' : '✓ खरेदी पावती जतन करा (Save Slip)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Procurement;
