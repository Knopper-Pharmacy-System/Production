import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface Sale {
  id?: number;
  item: string;
  price: number;
  timestamp: number;
}

export interface InventoryItem {
  id?: number;
  name?: string;
  productId?: number;
  product_name?: string;
  product_name_official?: string;
  product_id?: number;
  batch?: string;
  batch_number?: string;
  expiry?: string | null;
  expiry_date?: string | null;
  quantity?: number;
  quantity_on_hand?: number;
  price?: number;
  price_regular?: number;
  gondola?: string;
  gondola_code?: string;
  category?: string;
  sync_status?: string;
  timestamp?: number;
}

export class MyDatabase extends Dexie {
  sales!: Table<Sale>;
  inventory!: Table<InventoryItem>;

  constructor() {
    super('KnopperDB');
    this.version(1).stores({
      sales: '++id, timestamp',
      inventory: '++id, name, batch, gondola, category, sync_status'
    });
  }
}

export const db = new MyDatabase();