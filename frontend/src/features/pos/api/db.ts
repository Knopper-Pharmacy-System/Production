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
  qr?: string;
  qr_code?: string;
  barcode?: string;
  barcode_value?: string;
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

export interface ShiftSession {
  id?: number;
  shiftId: string;
  openingBalance: number;
  closingBalance?: number;
  openedAt: number;
  closedAt?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface AppSetting {
  key: string;
  value: string;
}

export class MyDatabase extends Dexie {
  sales!: Table<Sale>;
  inventory!: Table<InventoryItem>;
  shifts!: Table<ShiftSession>;
  settings!: Table<AppSetting>;

  constructor() {
    super('KnopperDB');
    this.version(2).stores({
      sales: '++id, timestamp',
      inventory: '++id, name, batch, gondola, category, sync_status',
      shifts: '++id, shiftId, status, openedAt',
      settings: '&key'
    });
  }
}

export const db = new MyDatabase();

export async function getActiveShift(): Promise<ShiftSession | null> {
  const activeShift = await db.shifts.where('status').equals('OPEN').first();
  return activeShift ?? null;
}

export async function startShift(amount: number): Promise<ShiftSession> {
  const activeShift = await getActiveShift();
  if (activeShift) return activeShift;

  const now = Date.now();
  const shift: ShiftSession = {
    shiftId: `SFT-${now}`,
    openingBalance: amount,
    openedAt: now,
    status: 'OPEN',
  };

  const id = await db.shifts.add(shift);
  return { ...shift, id };
}

export async function updateActiveShiftOpeningBalance(amount: number): Promise<ShiftSession | null> {
  const activeShift = await getActiveShift();
  if (!activeShift || activeShift.id == null) return null;

  await db.shifts.update(activeShift.id, { openingBalance: amount });
  return { ...activeShift, openingBalance: amount };
}

export async function closeShift(shiftId: string): Promise<void> {
  const activeShift = await db.shifts.where('shiftId').equals(shiftId).first();
  if (!activeShift) return;

  await db.shifts.update(activeShift.id as number, {
    status: 'CLOSED',
    closedAt: Date.now(),
  });
}

export async function closeShiftWithBalance(shiftId: string, closingBalance: number): Promise<ShiftSession | null> {
  const activeShift = await db.shifts.where('shiftId').equals(shiftId).first();
  if (!activeShift || activeShift.id == null) return null;

  const closedAt = Date.now();
  await db.shifts.update(activeShift.id, {
    status: 'CLOSED',
    closedAt,
    closingBalance,
  });

  return {
    ...activeShift,
    status: 'CLOSED',
    closedAt,
    closingBalance,
  };
}

export async function verifyManagerPin(pin: string): Promise<boolean> {
  const stored = await db.settings.get('managerPin');
  const envPin = import.meta.env.VITE_MANAGER_PIN as string | undefined;
  const fallbackPin = envPin || localStorage.getItem('manager_pin') || '1234';
  return pin === (stored?.value || fallbackPin);
}