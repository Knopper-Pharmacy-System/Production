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
  name: string;
  productId?: number;
  batch?: string;
  expiry?: string | null;
  quantity: number;
  price: number;
  gondola?: string;
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
      inventory: '++id, name, batch, gondola, sync_status'
    });
  }
}

export const db = new MyDatabase();