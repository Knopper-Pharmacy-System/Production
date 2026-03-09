import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface Sale {
  id?: number;
  item: string;
  price: number;
  timestamp: number;
}

export class MyDatabase extends Dexie {
  sales!: Table<Sale>; 

  constructor() {
    super('KnopperDB');
    this.version(1).stores({
      sales: '++id, timestamp' // Primary key and indexed fields
    });
  }
}

export const db = new MyDatabase();