import { useEffect, useState, useRef, useCallback } from "react";
import type { KeyboardEvent } from "react";
import {
  Calendar,
  Clock,
  LogOut,
  Plus,
  Receipt as ReceiptIcon,
  Trash2,
  User,
  Wifi,
  WifiOff,
  Search,
  ShoppingCart,
} from "lucide-react";
import logoOutline from "../assets/logo_outline.png";
import bannerLogo from "../assets/banner_logo.png";
import { db } from "../api/db"; // Enable Dexie for offline support
import { logout } from "../hooks/useAuth";

const PROD_API_BASE_URL = "https://web-production-2c7737.up.railway.app";
const DEV_API_BASE_URL = "http://localhost:5000";
const API_BASE_URL = import.meta.env.DEV ? DEV_API_BASE_URL : PROD_API_BASE_URL;

type CartItem = {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
  inventoryId?: number;
};

type InventoryItem = {
  id: number;              // inventory_id
  name: string;            // product_name_official
  productId?: number;
  batch: string;           // batch_number
  expiry: string | null;   // expiry_date as string
  quantity: number;        // quantity_on_hand
  price: number;           // price_regular
  gondola: string;         // gondola_code
};

function CashierPosPage() {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentPrice, setCurrentPrice] = useState("");
  const [currentItemDescription, setCurrentItemDescription] = useState("");
  const [discount, setDiscount] = useState(0);
  const [addOn, setAddOn] = useState(0);
  const [terminalId] = useState("001");
  const [invoiceNo] = useState("000000001");
  const [transNo] = useState("000000001");
  const [cashierName] = useState("Gino L.");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inventory modal
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedInventoryIndex, setSelectedInventoryIndex] = useState(0);
  const inventorySearchRef = useRef<HTMLInputElement | null>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).replace(",", "").toUpperCase());
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Online/offline status
  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  // Load inventory on search or modal open
  useEffect(() => {
    if (!showInventoryModal) return;

    const loadInventory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let items: InventoryItem[] = [];

        if (inventorySearch.trim()) {
          // Search mode
          if (navigator.onLine) {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("No authentication token found");

            const res = await fetch(`${API_BASE_URL}/inventory/search?name=${encodeURIComponent(inventorySearch)}`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (!res.ok) {
              throw new Error(`Failed to search inventory: ${res.status}`);
            }

            const data = await res.json();
            items = data.items.map((item: any) => ({
              id: item.inventory_id,
              name: item.product_name,
              productId: item.product_id,
              batch: item.batch_number || "—",
              expiry: item.expiry_date || null,
              quantity: Number(item.quantity_on_hand) || 0,
              price: Number(item.price) || 0,
              gondola: item.gondola_code || "—",
            }));
          } else {
            // Offline search: search local DB
            const localItems = await db.inventory
              .where('name').startsWithIgnoreCase(inventorySearch)
              .or('batch').startsWithIgnoreCase(inventorySearch)
              .toArray();
            items = localItems.map(item => ({
              id: item.id!,
              name: item.name,
              productId: item.productId,
              batch: item.batch || "—",
              expiry: item.expiry || null,
              quantity: item.quantity,
              price: item.price,
              gondola: item.gondola || "—",
            }));
          }
        } else {
          // Full inventory mode
          if (navigator.onLine) {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("No authentication token found");

            const res = await fetch(`${API_BASE_URL}/inventory/branch/1`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (!res.ok) {
              throw new Error(`Failed to load inventory: ${res.status}`);
            }

            const data = await res.json();
            items = data.map((item: any) => ({
              id: item.inventory_id,
              name: item.product_name || item.product_name_official || "Unnamed Product",
              productId: item.product_id,
              batch: item.batch_number || "—",
              expiry: item.expiry_date || null,
              quantity: Number(item.quantity_on_hand) || 0,
              price: Number(item.price) || 0,
              gondola: item.gondola_code || "—",
            }));

            // Sync to local DB
            await db.inventory.clear();
            await db.inventory.bulkAdd(items.map(i => ({ ...i, sync_status: "synced", timestamp: Date.now() })));
          } else {
            // Offline: load from local DB
            const localItems = await db.inventory.toArray();
            items = localItems.map(item => ({
              id: item.id!,
              name: item.name,
              productId: item.productId,
              batch: item.batch || "—",
              expiry: item.expiry || null,
              quantity: item.quantity,
              price: item.price,
              gondola: item.gondola || "—",
            }));
          }
        }

        setInventoryItems(items);
      } catch (err: any) {
        console.error("Inventory load error:", err);
        setError("Could not load inventory. " + (err.message || ""));
        setInventoryItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(loadInventory, inventorySearch.trim() ? 300 : 0); // No debounce for initial load
    return () => clearTimeout(debounceTimer);
  }, [showInventoryModal, inventorySearch]);  // Auto-scroll selected item
  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedInventoryIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent | Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === "F2") {
          e.preventDefault();
          setInventorySearch("");
          setSelectedInventoryIndex(0);
          setInventoryItems([]);
          setShowInventoryModal(true);
        } else if (e.key === "F12") {
          e.preventDefault();
          handlePayment();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cartItems]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const amountDue = subtotal - discount + addOn;

  const addItemToCart = (item: InventoryItem) => {
    if (item.quantity < currentQuantity) {
      setError(`Not enough stock (${item.quantity} available)`);
      return;
    }

    const newCartItem: CartItem = {
      id: Date.now(),
      description: `${item.name} (${item.batch})`,
      quantity: currentQuantity,
      price: item.price,
      total: currentQuantity * item.price,
      inventoryId: item.id,
    };

    setCartItems(prev => [...prev, newCartItem]);
    setCurrentItemDescription("");
    setCurrentQuantity(1);
    setCurrentPrice("");
    setShowInventoryModal(false);
    setError(null);
  };

  const removeItemFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // You could implement manual entry logic here if needed
    }
  };

  const handleModalKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedInventoryIndex(i => Math.min(i + 1, inventoryItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedInventoryIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (inventoryItems[selectedInventoryIndex]) {
        addItemToCart(inventoryItems[selectedInventoryIndex]);
      }
    } else if (e.key === "Escape") {
      setShowInventoryModal(false);
    }
  };

  const handlePayment = useCallback(async () => {
    if (cartItems.length === 0) {
      setError("Cart is empty");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Send sale to backend (SALES_HEADERS + SALES_DETAILS)
      // For now just simulate success
      await new Promise(r => setTimeout(r, 800));
      setCartItems([]);
      setDiscount(0);
      setAddOn(0);
      setError("Payment successful — receipt printed!");
      setTimeout(() => setError(null), 4000);
    } catch (err) {
      setError("Payment processing failed");
    } finally {
      setIsLoading(false);
    }
  }, [cartItems]);

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-100 p-6 font-sans">
      <div className="mx-auto grid h-full max-w-[1800px] grid-cols-[1fr_400px] gap-6 overflow-hidden">

        {/* LEFT - Transaction Area */}
        <div className="flex flex-col gap-6 overflow-hidden h-full">

          {/* Header */}
          <header className="flex shrink-0 items-center justify-between rounded-2xl bg-gradient-to-r from-[#041848] to-[#062d8c] p-5 shadow-lg">
            <img src={bannerLogo} alt="Logo" className="h-10 w-auto" />
            <div className="flex items-center gap-6">
              <div className="text-right text-white">
                <p className="text-[10px] uppercase tracking-widest text-blue-300">Terminal ID</p>
                <p className="font-bold">{terminalId}</p>
              </div>
              <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white ${isOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className="text-xs font-bold uppercase">{isOnline ? "Online" : "Offline"}</span>
              </div>
              <button onClick={logout} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/20">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </header>

          {/* Amount Due */}
          <div className="shrink-0 rounded-2xl bg-[#062d8c] p-8 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Amount Due</p>
            <p className="text-7xl font-black text-white">
              <span className="mr-2 text-3xl font-light text-blue-400">PHP</span>
              {amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                <p className="text-red-100 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* IDs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 grid grid-cols-3 gap-6 shrink-0">
            <div><span className="text-slate-600 text-sm">Term ID:</span> <span className="font-bold">{terminalId}</span></div>
            <div><span className="text-slate-600 text-sm">Invoice No.:</span> <span className="font-bold">{invoiceNo}</span></div>
            <div><span className="text-slate-600 text-sm">Trans No.:</span> <span className="font-bold">{transNo}</span></div>
          </div>

          {/* Cart Table */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="shrink-0 border-b border-slate-100 bg-slate-50">
              <div className="grid grid-cols-[60px_1fr_100px_140px_160px] text-[11px] font-black uppercase tracking-wider text-slate-500 p-4">
                <span>#</span>
                <span>Description / Batch</span>
                <span className="text-center">Qty</span>
                <span className="text-center">Unit Price</span>
                <span className="text-right pr-8">Total</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {cartItems.map((item, idx) => (
                <div key={item.id} className="group grid grid-cols-[60px_1fr_100px_140px_160px] border-b border-slate-50 p-4 items-center hover:bg-blue-50/50">
                  <span className="text-sm font-bold text-slate-400">{idx + 1}</span>
                  <span className="font-semibold text-slate-800">{item.description}</span>
                  <span className="text-center font-bold text-slate-700">{item.quantity}</span>
                  <span className="text-center text-slate-600">{item.price.toFixed(2)}</span>
                  <div className="flex justify-end items-center gap-4 font-bold text-[#062d8c]">
                    <span>{item.total.toFixed(2)}</span>
                    <button onClick={() => removeItemFromCart(item.id)} className="p-1.5 text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="shrink-0 rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="grid grid-cols-[1fr_100px_140px_auto] gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Description</label>
                <input
                  type="text"
                  value={currentItemDescription}
                  onChange={e => setCurrentItemDescription(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Scan or type item..."
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 text-center block">Qty</label>
                <input
                  type="number"
                  value={currentQuantity}
                  onChange={e => setCurrentQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-center font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Price</label>
                <input
                  type="number"
                  value={currentPrice}
                  onChange={e => setCurrentPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 font-bold outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => {/* manual add if needed */}}
                className="bg-[#062d8c] text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#041848]"
              >
                <Plus className="h-5 w-5" /> ADD
              </button>
            </div>

            <div className="flex items-center justify-between mt-4 text-slate-500">
              <span className="text-sm font-semibold">Next item #{cartItems.length + 1}</span>
              <button
                onClick={() => {
                  setInventorySearch("");
                  setSelectedInventoryIndex(0);
                  setInventoryItems([]);
                  setShowInventoryModal(true);
                }}
                className="bg-white border-2 border-[#062d8c] text-[#062d8c] px-6 py-2 rounded-xl hover:bg-[#f0f4ff] font-semibold flex items-center gap-2"
              >
                <Search className="h-5 w-5" /> Inventory (F2)
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT - Summary */}
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          <div className="shrink-0 flex items-center justify-between rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white"><ReceiptIcon className="h-5 w-5" /></div>
              <h2 className="text-lg font-black text-slate-800 uppercase">Summary</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">#{invoiceNo}</span>
          </div>

          <div className="shrink-0 space-y-4 rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span><span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 font-bold">Discount</span>
              <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value) || 0)} className="w-24 text-right bg-red-50 border rounded p-1" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-bold">Add-on</span>
              <input type="number" value={addOn} onChange={e => setAddOn(Number(e.target.value) || 0)} className="w-24 text-right bg-slate-100 border rounded p-1" />
            </div>
            <hr className="my-2 border-slate-200" />
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold uppercase text-slate-400">Total</span>
              <span className="text-3xl font-black text-[#062d8c]">₱{amountDue.toFixed(2)}</span>
            </div>
            <button
              onClick={handlePayment}
              disabled={isLoading || cartItems.length === 0}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-emerald-700 disabled:opacity-50 mt-4"
            >
              {isLoading ? "Processing..." : "PAYMENT (F12)"}
            </button>
          </div>

          {/* Branding */}
          <div className="flex-1 min-h-[120px] relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#041848] to-[#3266e6] shadow-xl flex flex-col items-center justify-center p-6">
            <img src={logoOutline} alt="Logo" className="h-20 w-20 opacity-30 mb-4" />
            <p className="text-2xl font-black text-white tracking-tighter">KNOPPER <span className="text-blue-400">POS</span></p>
            <p className="text-[10px] uppercase text-blue-200 tracking-[0.4em] mt-1">Pharmacy Edition</p>
          </div>

          {/* User info */}
          <div className="shrink-0 rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-[#062d8c]">
                <User />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Cashier</p>
                <p className="font-black text-slate-800">{cashierName}</p>
              </div>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-xl">
              <span><Calendar className="inline h-3.5 w-3.5 mr-1" />{currentDate}</span>
              <span><Clock className="inline h-3.5 w-3.5 mr-1" />{currentTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInventoryModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#041848] to-[#062d8c] px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-white">
                <Search className="h-6 w-6" />
                <h2 className="font-bold text-xl uppercase tracking-wide">Inventory Search</h2>
              </div>
              <span className="text-blue-200 text-sm">Esc to close</span>
            </div>

            {/* Search */}
            <div className="p-6 border-b shrink-0">
              <input
                ref={inventorySearchRef}
                type="text"
                value={inventorySearch}
                onChange={e => { setInventorySearch(e.target.value); setSelectedInventoryIndex(0); }}
                onKeyDown={handleModalKeyDown}
                placeholder="Search product name or batch number..."
                className="w-full px-5 py-4 border-2 border-blue-600 rounded-xl text-lg outline-none focus:ring-2 focus:ring-blue-200"
                autoFocus
              />
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[3fr_140px_100px_120px_100px_100px] bg-slate-100 border-b font-bold text-xs uppercase text-slate-600 px-2 py-3 shrink-0">
              <div className="px-4">Product / Description</div>
              <div className="px-2">Batch</div>
              <div className="text-center">Stock</div>
              <div className="text-right pr-4">Price</div>
              <div className="text-center">Expiry</div>
              <div className="text-center">Gondola</div>
            </div>

            {/* Items */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                  <p>Loading inventory...</p>
                </div>
              ) : inventoryItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <ShoppingCart className="h-16 w-16 opacity-30 mb-4" />
                  <p className="text-lg font-medium">No items found</p>
                </div>
              ) : (
                inventoryItems.map((item, idx) => {
                  const isSelected = idx === selectedInventoryIndex;
                  const isLowStock = item.quantity <= 10;
                  const isNearExpiry = item.expiry && new Date(item.expiry) < new Date(Date.now() + 30*24*60*60*1000);

                  return (
                    <div
                      key={item.id}
                      ref={isSelected ? selectedItemRef : null}
                      onClick={() => addItemToCart(item)}
                      className={`grid grid-cols-[3fr_140px_100px_120px_100px_100px] items-center px-2 py-3 border-b cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-100 border-l-4 border-l-blue-600" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="px-4 font-medium">{item.name}</div>
                      <div className="px-2 font-mono text-slate-600">{item.batch}</div>
                      <div className={`text-center font-bold ${isLowStock ? "text-red-600" : "text-emerald-700"}`}>
                        {item.quantity}
                      </div>
                      <div className="text-right pr-4 font-bold text-[#062d8c]">
                        ₱{item.price.toFixed(2)}
                      </div>
                      <div className={`text-center ${isNearExpiry ? "text-orange-600 font-semibold" : "text-slate-600"}`}>
                        {item.expiry ? new Date(item.expiry).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) : "—"}
                      </div>
                      <div className="text-center font-mono text-slate-600">{item.gondola}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div>
                <kbd className="bg-slate-200 px-2 py-1 rounded">↑ ↓</kbd> Navigate •
                <kbd className="bg-slate-200 px-2 py-1 rounded ml-2">Enter</kbd> Add •
                <kbd className="bg-slate-200 px-2 py-1 rounded ml-2">Esc</kbd> Close
              </div>
              <div>{inventoryItems.length} items found</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashierPosPage;