import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Manager() {
  const [activeTab, setActiveTab] = useState('verification');

  const [unverifiedFarmers, setUnverifiedFarmers] = useState([]);
  const [flaggedProcurements, setFlaggedProcurements] = useState([]);
  const [allProcurements, setAllProcurements] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  const [priceForm, setPriceForm] = useState({
    cropId: '',
    grade: 'A',
    ratePerQuintal: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'verification') {
        const res = await api.get('/farmers');
        setUnverifiedFarmers(res.data.filter(f => !f.isVerified));
      } else if (activeTab === 'prices') {
        const cropsRes = await api.get('/prices/crops');
        setCrops(cropsRes.data);
      } else if (activeTab === 'anomalies') {
        const res = await api.get('/procurements');
        setFlaggedProcurements(res.data.filter(p => p.aiFlagged));
      } else if (activeTab === 'payments') {
        const res = await api.get('/procurements');
        setAllProcurements(res.data);
      }
    } catch (err) {
      console.error('Error fetching manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBank = async (farmerId) => {
    try {
      await api.patch(`/farmers/${farmerId}/verify`);
      setUnverifiedFarmers(prev => prev.filter(f => f.id !== farmerId));
      alert('✅ शेतकरी बँक तपशील यशस्वीरीत्या पडताळले गेले आहेत!');
    } catch (err) {
      console.error('Verification failed:', err);
      alert('पडताळणी अयशस्वी. कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/prices', {
        ...priceForm,
        ratePerQuintal: parseFloat(priceForm.ratePerQuintal)
      });
      alert('✅ आजचे अधिकृत दर यशस्वीरीत्या सर्व संकलन केंद्रांना प्रसिद्ध केले गेले आहेत!');
      setPriceForm({ cropId: '', grade: 'A', ratePerQuintal: '' });
    } catch (err) {
      console.error('Failed to set price:', err);
      alert('दर अपडेट करणे अयशस्वी झाले.');
    }
  };

  const handleApprovePayment = async (procurementId) => {
    try {
      await api.patch(`/procurements/${procurementId}/approve`);
      setAllProcurements(prev => prev.map(p => p.id === procurementId ? { ...p, paymentStatus: 'APPROVED' } : p));
      alert('✅ खरेदी पावती पेमेंटसाठी मंजूर करण्यात आली आहे.');
    } catch (err) {
      console.error('Approval failed:', err);
      alert('पेमेंट मंजुरी अयशस्वी.');
    }
  };

  const handleExportBankFile = async () => {
    try {
      const response = await api.get('/procurements/export-bank-file', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bank_disbursement_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export bank file:', err);
      alert('बँक फाईल डाउनलोड करणे अयशस्वी.');
    }
  };

  return (
    <div className="gov-container">
      {/* Top Banner */}
      <div className="gov-card">
        <div className="gov-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0a3d62' }}>🏛️ मुख्य कार्यालय व्यवस्थापक नियंत्रण कक्ष (Office Manager Panel)</h2>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              बँक पडताळणी, दर फलक व्यवस्थापन, AI गैरव्यवहार शोध व थेट बँक पेमेंट मंजुरी
            </p>
          </div>
          <button
            onClick={handleExportBankFile}
            className="gov-btn gov-btn-success"
            style={{ fontSize: '0.9rem', padding: '0.55rem 1rem' }}
          >
            📥 बँक पेमेंट फाईल डाउनलोड (Export CSV)
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('verification')}
          className={`gov-btn ${activeTab === 'verification' ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
        >
          🏦 बँक पडताळणी (Bank Verification)
        </button>
        <button
          onClick={() => setActiveTab('prices')}
          className={`gov-btn ${activeTab === 'prices' ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
        >
          📈 दर फलक प्रसिद्धी (Daily Price Board)
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`gov-btn ${activeTab === 'anomalies' ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
        >
          🚨 AI संशयास्पद नोंदी (AI Anomaly Alerts)
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`gov-btn ${activeTab === 'payments' ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
        >
          💳 पेमेंट मंजुरी (Payment Approvals)
        </button>
      </div>

      {/* Tab 1: Bank Verification */}
      {activeTab === 'verification' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <h3>प्रलंबित बँक पडताळणी अर्ज (Pending Bank Approvals)</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              प्रलंबित अर्ज संख्या: <strong>{unverifiedFarmers.length}</strong>
            </span>
          </div>
          <div className="gov-card-body" style={{ padding: 0 }}>
            {loading ? (
              <p style={{ padding: '1.5rem', color: '#64748b' }}>माहिती लोड होत आहे...</p>
            ) : unverifiedFarmers.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#166534', backgroundColor: '#f0fdf4' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                  ✅ सर्व शेतकऱ्यांचे बँक तपशील पडताळले गेलेले आहेत!
                </p>
                <p style={{ fontSize: '0.88rem', margin: '0.25rem 0 0', color: '#4b5563' }}>
                  कोणतेही प्रलंबित बँक पडताळणी अर्ज शिल्लक नाहीत.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="gov-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>शेतकरी कोड</th>
                      <th>शेतकऱ्याचे नाव</th>
                      <th>बँकेचे नाव</th>
                      <th>खाते क्रमांक</th>
                      <th>IFSC कोड</th>
                      <th>कृती (Action)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unverifiedFarmers.map(farmer => (
                      <tr key={farmer.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{farmer.farmerCode}</td>
                        <td style={{ fontWeight: 600 }}>{farmer.name}</td>
                        <td>{farmer.bankName}</td>
                        <td style={{ fontFamily: 'monospace' }}>{farmer.accountNumber}</td>
                        <td style={{ fontFamily: 'monospace' }}>{farmer.ifscCode}</td>
                        <td>
                          <button
                            onClick={() => handleVerifyBank(farmer.id)}
                            className="gov-btn gov-btn-success"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                          >
                            ✓ मंजूर करा (Approve)
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Daily Price Board */}
      {activeTab === 'prices' && (
        <div className="gov-card" style={{ maxWidth: '600px' }}>
          <div className="gov-card-header">
            <h3>केंद्रीय दैनिक भाव प्रसिद्धी (Set Official Rates)</h3>
          </div>
          <div className="gov-card-body">
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              येथे निश्चित केलेले दर सर्व संकलन केंद्रांवर थेट लागू होतील. स्थानिक चालकांना दर बदलण्याची परवानगी नाही.
            </p>
            <form onSubmit={handlePriceSubmit}>
              <div className="gov-form-group">
                <label>पीक निवडा / Select Crop *</label>
                <select
                  className="gov-select"
                  value={priceForm.cropId}
                  onChange={e => setPriceForm({ ...priceForm, cropId: e.target.value })}
                  required
                >
                  <option value="">-- पीक निवडा --</option>
                  {crops.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="gov-form-group">
                <label>प्रत / Grade *</label>
                <select
                  className="gov-select"
                  value={priceForm.grade}
                  onChange={e => setPriceForm({ ...priceForm, grade: e.target.value })}
                  required
                >
                  <option value="A">Grade A (उत्कृष्ट प्रत)</option>
                  <option value="B">Grade B (मध्यम प्रत)</option>
                  <option value="C">Grade C (साधारण प्रत)</option>
                </select>
              </div>

              <div className="gov-form-group">
                <label>अधिकृत दर (₹ / क्विंटल) / Rate per Quintal *</label>
                <input
                  type="number"
                  step="0.01"
                  className="gov-input"
                  placeholder="उदा. 4950.00"
                  value={priceForm.ratePerQuintal}
                  onChange={e => setPriceForm({ ...priceForm, ratePerQuintal: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="gov-btn gov-btn-primary"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
              >
                📢 दर प्रसिद्ध करा (Publish Rates to Centers)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: AI Anomaly Alerts */}
      {activeTab === 'anomalies' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <h3>🚨 AI संशयास्पद गैरव्यवहार नोंदी (AI Flagged Anomalies)</h3>
          </div>
          <div className="gov-card-body" style={{ padding: 0 }}>
            <div style={{ padding: '0.75rem 1rem', background: '#fffbeb', borderBottom: '1px solid #fef3c7', fontSize: '0.85rem', color: '#92400e' }}>
              ⚠️ जमीन क्षेत्रापेक्षा अवाजवी जास्त उत्पादन (Yield &gt; 2500 kg/ha) किंवा १ तासात वारंवार विक्री करणाऱ्या नोंदी स्वयंचलित ध्वजांकित (Flag) करण्यात येतात.
            </div>

            {loading ? (
              <p style={{ padding: '1.5rem', color: '#64748b' }}>तपासणी सुरू आहे...</p>
            ) : flaggedProcurements.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#166534' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                  ✅ सर्व संकलन केंद्रे सुरळीत कार्यरत आहेत
                </p>
                <p style={{ fontSize: '0.88rem', margin: '0.25rem 0 0', color: '#64748b' }}>
                  कोणत्याही संशयास्पद नोंदी आढळल्या नाहीत.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="gov-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>पावती क्रमांक</th>
                      <th>शेतकऱ्याचे नाव</th>
                      <th>काटे वजन</th>
                      <th>ओलावा</th>
                      <th>रक्कम</th>
                      <th>AI ध्वजांकन कारण (Alert Reason)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flaggedProcurements.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.slipNo}</td>
                        <td style={{ fontWeight: 600 }}>{item.farmer?.name || 'Farmer'}</td>
                        <td>{item.netWeight} kg</td>
                        <td>{item.moisture}%</td>
                        <td style={{ fontWeight: 700, color: '#1b5e20' }}>₹{item.totalAmount}</td>
                        <td>
                          <span className="gov-badge gov-badge-flagged">
                            ⚠️ {item.aiFlagReason || 'Suspicious Yield'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Payment Approvals */}
      {activeTab === 'payments' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <h3>खरेदी पावत्या व थेट बँक पेमेंट मंजुरी (Payment Approvals)</h3>
          </div>
          <div className="gov-card-body" style={{ padding: 0 }}>
            {loading ? (
              <p style={{ padding: '1.5rem', color: '#64748b' }}>माहिती लोड होत आहे...</p>
            ) : allProcurements.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>कोणत्याही खरेदी नोंदी आढळल्या नाहीत.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="gov-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>पावती क्र.</th>
                      <th>शेतकरी</th>
                      <th>पीक</th>
                      <th>वजन (kg)</th>
                      <th>देय रक्कम</th>
                      <th>स्थिती (Status)</th>
                      <th>कृती (Action)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProcurements.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.slipNo}</td>
                        <td style={{ fontWeight: 600 }}>{p.farmer?.name}</td>
                        <td>{p.crop?.name} ({p.grade})</td>
                        <td>{p.netWeight} kg</td>
                        <td style={{ fontWeight: 700, color: '#1b5e20' }}>₹{p.totalAmount}</td>
                        <td>
                          {p.paymentStatus === 'APPROVED' ? (
                            <span className="gov-badge gov-badge-verified">✓ मंजूर (Approved)</span>
                          ) : (
                            <span className="gov-badge gov-badge-pending">प्रलंबित (Pending)</span>
                          )}
                        </td>
                        <td>
                          {p.paymentStatus !== 'APPROVED' ? (
                            <button
                              onClick={() => handleApprovePayment(p.id)}
                              className="gov-btn gov-btn-success"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                            >
                              पेमेंट मंजूर करा
                            </button>
                          ) : (
                            <span style={{ color: '#166534', fontSize: '0.85rem', fontWeight: 600 }}>
                              बँक फाईलमध्ये समाविष्ट
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
      )}
    </div>
  );
}

export default Manager;
