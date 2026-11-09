import React from 'react';

function Footer() {
  return (
    <footer className="gov-footer">
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <strong>शेतकरी खरेदी व संकलन प्रणाली (FPC Procurement Portal)</strong>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem' }}>
            DPDP Act 2023 Compliant • Offline-First PWA Technology • ISO/IEC Data Standards
          </p>
        </div>
        <div style={{ fontSize: '0.78rem' }}>
          हेल्पलाइन: १८००-XXX-XXXX | संपर्क: support@fpc-procure.gov.in
        </div>
      </div>
    </footer>
  );
}

export default Footer;

