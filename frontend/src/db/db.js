import Dexie from 'dexie';

export const db = new Dexie('FarmerProcurementDB');

// Define tables and indices
db.version(1).stores({
  // Farmers: local cache of the Farmer Registry
  farmers: 'id, farmerCode, name, village, bankVerified, syncStatus',

  // Procurements: Local buffer for offline entries
  procurements: 'id, slipNo, farmerId, cropId, localTimestamp, syncStatus',

  // Prices: Local cache of the daily price board
  prices: 'id, cropId, date, grade',

  // User: Persist current session
  user: 'id, username, role, token'
});
