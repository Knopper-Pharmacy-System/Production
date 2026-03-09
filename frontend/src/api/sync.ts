import { db } from './db';

export const syncOfflineData = async () => {
  if (!navigator.onLine) return;

  const pendingSales = await db.sales.toArray();
  
  for (const sale of pendingSales) {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify(sale),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Remove from local DB once successfully sent to Railway
        await db.sales.delete(sale.id);
      }
    } catch (error) {
      console.error("Sync failed for item:", sale.id);
    }
  }
};

// Listen for connection recovery
window.addEventListener('online', syncOfflineData);