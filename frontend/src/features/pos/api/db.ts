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
  branchName: string;
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

export interface SuspendedCartItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
  inventoryId?: number;
}

export interface SuspendedTransaction {
  key: string;
  branchName: string;
  cashierName: string;
  cartItems: SuspendedCartItem[];
  addOn: number;
  discountTypeIndex: number;
  currentItemDescription: string;
  savedAt: number;
}

export interface CompletedTransaction {
  id?: number;
  receiptNo: string;
  transactionNo: string;
  branchName: string;
  cashierName: string;
  cartItems: SuspendedCartItem[];
  subtotal: number;
  discount: number;
  addOn: number;
  amountDue: number;
  paidAt: number;
}

export interface ReturnRecord {
  id?: number;
  receiptNo: string;
  transactionNo: string;
  branchName: string;
  cashierName: string;
  originalProduct: string;
  inventoryId?: number;
  quantity: number;
  replacementProduct?: string;
  reason: string;
  approvedBy: string;
  voidedAt: number;
}

export interface ElectronicJournalEntry {
  id?: number;
  branchName: string;
  cashierName: string;
  keyLabel: string;
  action: string;
  details?: string;
  timestamp: number;
}

export class MyDatabase extends Dexie {
  sales!: Table<Sale>;
  inventory!: Table<InventoryItem>;
  shifts!: Table<ShiftSession>;
  settings!: Table<AppSetting>;
  suspendedTransactions!: Table<SuspendedTransaction>;
  completedTransactions!: Table<CompletedTransaction>;
  returnRecords!: Table<ReturnRecord>;
  electronicJournal!: Table<ElectronicJournalEntry>;

  constructor() {
    super('KnopperDB');
    this.version(6).stores({
      sales: '++id, timestamp',
      inventory: '++id, name, batch, gondola, category, sync_status',
      shifts: '++id, shiftId, status, openedAt, branchName',
      settings: '&key',
      suspendedTransactions: '&key, branchName, cashierName, savedAt',
      completedTransactions: '++id, receiptNo, transactionNo, branchName, cashierName, paidAt',
      returnRecords: '++id, receiptNo, transactionNo, branchName, cashierName, voidedAt',
      electronicJournal: '++id, branchName, cashierName, keyLabel, action, timestamp'
    });
  }
}

export const db = new MyDatabase();

export function getCurrentBranchName(): string {
  return localStorage.getItem('lastBranch') || 'BMC MAIN';
}

export async function getActiveShift(branchName = getCurrentBranchName()): Promise<ShiftSession | null> {
  const activeShift = await db.shifts
    .where('branchName')
    .equals(branchName)
    .and((shift) => shift.status === 'OPEN')
    .first();
  return activeShift ?? null;
}

export async function startShift(amount: number, branchName = getCurrentBranchName()): Promise<ShiftSession> {
  const activeShift = await getActiveShift(branchName);
  if (activeShift) return activeShift;

  const now = Date.now();
  const shift: ShiftSession = {
    shiftId: `SFT-${now}`,
    branchName,
    openingBalance: amount,
    openedAt: now,
    status: 'OPEN',
  };

  const id = await db.shifts.add(shift);
  return { ...shift, id };
}

export async function updateActiveShiftOpeningBalance(amount: number, branchName = getCurrentBranchName()): Promise<ShiftSession | null> {
  const activeShift = await getActiveShift(branchName);
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

const getSuspendedTransactionKey = (branchName: string, cashierName: string) =>
  `${branchName}::${cashierName}`;

export async function suspendTransaction(payload: {
  branchName: string;
  cashierName: string;
  cartItems: SuspendedCartItem[];
  addOn: number;
  discountTypeIndex: number;
  currentItemDescription: string;
}): Promise<SuspendedTransaction> {
  const key = getSuspendedTransactionKey(payload.branchName, payload.cashierName);
  const record: SuspendedTransaction = {
    key,
    branchName: payload.branchName,
    cashierName: payload.cashierName,
    cartItems: payload.cartItems,
    addOn: payload.addOn,
    discountTypeIndex: payload.discountTypeIndex,
    currentItemDescription: payload.currentItemDescription,
    savedAt: Date.now(),
  };

  await db.suspendedTransactions.put(record);
  return record;
}

export async function getSuspendedTransaction(branchName: string, cashierName: string): Promise<SuspendedTransaction | null> {
  const key = getSuspendedTransactionKey(branchName, cashierName);
  const record = await db.suspendedTransactions.get(key);
  return record ?? null;
}

export async function clearSuspendedTransaction(branchName: string, cashierName: string): Promise<void> {
  const key = getSuspendedTransactionKey(branchName, cashierName);
  await db.suspendedTransactions.delete(key);
}

export async function recordCompletedTransaction(payload: {
  receiptNo: string;
  transactionNo: string;
  branchName: string;
  cashierName: string;
  cartItems: SuspendedCartItem[];
  subtotal: number;
  discount: number;
  addOn: number;
  amountDue: number;
}): Promise<CompletedTransaction> {
  const record: CompletedTransaction = {
    receiptNo: payload.receiptNo,
    transactionNo: payload.transactionNo,
    branchName: payload.branchName,
    cashierName: payload.cashierName,
    cartItems: payload.cartItems,
    subtotal: payload.subtotal,
    discount: payload.discount,
    addOn: payload.addOn,
    amountDue: payload.amountDue,
    paidAt: Date.now(),
  };

  const id = await db.completedTransactions.add(record);
  return { ...record, id };
}

export async function getCompletedTransactionByReceipt(receiptNo: string, branchName?: string): Promise<CompletedTransaction | null> {
  const trimmedReceipt = receiptNo.trim();
  if (!trimmedReceipt) return null;

  const found = await db.completedTransactions
    .where('receiptNo')
    .equals(trimmedReceipt)
    .toArray();

  const scoped = branchName
    ? found.filter((transaction) => transaction.branchName === branchName)
    : found;

  const latest = scoped.sort((left, right) => right.paidAt - left.paidAt)[0];
  if (!latest) return null;
  return latest;
}

export async function getRecentCompletedTransactions(branchName: string, limit = 10): Promise<CompletedTransaction[]> {
  const transactions = await db.completedTransactions
    .where('branchName')
    .equals(branchName)
    .reverse()
    .sortBy('paidAt');

  return transactions.slice(0, limit);
}

export async function recordReturnVoid(payload: {
  receiptNo: string;
  transactionNo: string;
  branchName: string;
  cashierName: string;
  originalProduct: string;
  inventoryId?: number;
  quantity: number;
  replacementProduct?: string;
  reason: string;
  approvedBy: string;
}): Promise<ReturnRecord> {
  const record: ReturnRecord = {
    receiptNo: payload.receiptNo,
    transactionNo: payload.transactionNo,
    branchName: payload.branchName,
    cashierName: payload.cashierName,
    originalProduct: payload.originalProduct,
    inventoryId: payload.inventoryId,
    quantity: payload.quantity,
    replacementProduct: payload.replacementProduct,
    reason: payload.reason,
    approvedBy: payload.approvedBy,
    voidedAt: Date.now(),
  };

  const id = await db.returnRecords.add(record);
  return { ...record, id };
}

export async function logElectronicJournal(payload: {
  branchName: string;
  cashierName: string;
  keyLabel: string;
  action: string;
  details?: string;
}): Promise<ElectronicJournalEntry> {
  const entry: ElectronicJournalEntry = {
    branchName: payload.branchName,
    cashierName: payload.cashierName,
    keyLabel: payload.keyLabel,
    action: payload.action,
    details: payload.details,
    timestamp: Date.now(),
  };

  const id = await db.electronicJournal.add(entry);
  return { ...entry, id };
}

export async function getElectronicJournalEntries(branchName: string, cashierName: string, limit = 200): Promise<ElectronicJournalEntry[]> {
  const entries = await db.electronicJournal
    .where('branchName')
    .equals(branchName)
    .and((entry) => entry.cashierName === cashierName)
    .reverse()
    .sortBy('timestamp');

  return entries.slice(0, limit);
}

export async function restoreInventoryStock(
  items: Array<{ inventoryId?: number; quantity: number }>
): Promise<void> {
  for (const item of items) {
    if (!item.inventoryId) continue;
    const existing = await db.inventory.get(item.inventoryId);
    if (!existing) continue;
    const currentQty = existing.quantity_on_hand ?? existing.quantity ?? 0;
    await db.inventory.update(item.inventoryId, {
      quantity_on_hand: currentQty + item.quantity,
      quantity: currentQty + item.quantity,
    });
  }
}

export async function deductInventoryStock(
  items: Array<{ inventoryId?: number; quantity: number }>
): Promise<void> {
  for (const item of items) {
    if (!item.inventoryId) continue;
    const existing = await db.inventory.get(item.inventoryId);
    if (!existing) continue;
    const currentQty = existing.quantity_on_hand ?? existing.quantity ?? 0;
    const nextQty = Math.max(0, currentQty - item.quantity);
    await db.inventory.update(item.inventoryId, {
      quantity_on_hand: nextQty,
      quantity: nextQty,
    });
  }
}

export async function getReturnRecordsByReceipt(
  receiptNo: string,
  branchName?: string
): Promise<ReturnRecord[]> {
  const records = await db.returnRecords
    .where('receiptNo')
    .equals(receiptNo)
    .toArray();
  if (branchName) return records.filter((r) => r.branchName === branchName);
  return records;
}

export async function getLastClosedShift(branchName = getCurrentBranchName()): Promise<ShiftSession | null> {
  const closed = await db.shifts
    .where('branchName')
    .equals(branchName)
    .and((shift) => shift.status === 'CLOSED')
    .reverse()
    .sortBy('closedAt');
  return closed[0] ?? null;
}

export async function getCompletedTransactionsByCashier(payload: {
  branchName: string;
  cashierName: string;
  fromTimestamp?: number;
  toTimestamp?: number;
}): Promise<CompletedTransaction[]> {
  const from = payload.fromTimestamp ?? 0;
  const to = payload.toTimestamp ?? Date.now();

  const records = await db.completedTransactions
    .where('branchName')
    .equals(payload.branchName)
    .and((transaction) =>
      transaction.cashierName === payload.cashierName &&
      transaction.paidAt >= from &&
      transaction.paidAt <= to
    )
    .toArray();

  return records.sort((left, right) => left.paidAt - right.paidAt);
}