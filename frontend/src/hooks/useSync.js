import { useEffect } from 'react';
import { db } from '../db/db';
import api from '../services/api';

/**
 * Custom hook to handle background synchronization of offline data.
 * It listens for connectivity changes and performs periodic syncs.
 */
export const useSync = () => {
  useEffect(() => {
    // 1. Initial sync on mount
    syncData();

    // 2. Listen for 'online' event to trigger sync
    const handleOnline = () => {
      console.log("Device is online. Triggering sync...");
      syncData();
    };

    window.addEventListener('online', handleOnline);

    // 3. Periodic sync every 30 seconds (optional fallback)
    const interval = setInterval(syncData, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);

  const syncData = async () => {
    if (!navigator.onLine) return;

    try {
      // --- Sync Farmers first (Procurements depend on Farmer IDs) ---
      const pendingFarmers = await db.farmers.where('syncStatus').equals('PENDING').toArray();

      for (const farmer of pendingFarmers) {
        try {
          const { id, syncStatus, ...farmerData } = farmer; // Strip local fields
          const response = await api.post('/farmers', {
            ...farmerData,
            landArea: parseFloat(farmerData.landArea)
          });

          // Update the local record with the real backend ID and mark as SYNCED
          // We delete the temp one and add the new one to avoid ID conflicts
          await db.farmers.delete(farmer.id);
          await db.farmers.add(response.data);

          // If we had procurements linked to this temp ID, we'd need to update them too
          await db.procurements
            .where('farmerId')
            .equals(farmer.id)
            .modify({ farmerId: response.data.id });

          console.log(`Synced farmer: ${response.data.name}`);
        } catch (err) {
          console.error(`Failed to sync farmer ${farmer.name}:`, err);
        }
      }

      // --- Sync Procurements ---
      const pendingProcurements = await db.procurements.where('syncStatus').equals('PENDING').toArray();

      for (const record of pendingProcurements) {
        try {
          const { id, syncStatus, ...data } = record; // Strip local fields
          await api.post('/procurements', data);

          // Mark as synced locally
          await db.procurements.update(record.id, { syncStatus: 'SYNCED' });
          console.log(`Synced procurement slip: ${record.slipNo}`);
        } catch (err) {
          console.error(`Failed to sync procurement ${record.slipNo}:`, err);
          // If it's a 409 Conflict (duplicate), we might want to mark it synced anyway
          if (err.response?.status === 409) {
            await db.procurements.update(record.id, { syncStatus: 'SYNCED' });
          }
        }
      }

    } catch (error) {
      console.error("General sync error:", error);
    }
  };

  return { syncNow: syncData };
};
