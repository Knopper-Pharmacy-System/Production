import { useEffect, useState, useRef, useCallback } from "react";
import type { KeyboardEvent } from "react";
import {
  Calendar,
  Clock,
  LogOut,
  Receipt as ReceiptIcon,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import logoOutline from "../assets/logo_outline.png";
import bannerLogo from "../assets/banner_logo.png";
import { db } from "../api/db"; // Enable Dexie for offline support
import { logout } from "../hooks/useAuth";
import InventoryModal from "../components/InventoryModal";
import CartDisplay from "../components/CartDisplay";

const PROD_API_BASE_URL = "https://web-production-2c7737.up.railway.app";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || PROD_API_BASE_URL;

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "MEDICINE", label: "Medicine" },
  { value: "GROCERY", label: "Grocery" },
  { value: "EQUIPMENT", label: "Equipment" },
];

type CartItem = {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
  inventoryId?: number;
};

type SelectedItem = {
  id: number;
  name: string;
  batch: string;
  price: number;
  quantity: number;
  total: number;
  stock: number; // available stock
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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedInventoryIndex, setSelectedInventoryIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const inventorySearchRef = useRef<HTMLInputElement | null>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  // Background load all inventory after login
  useEffect(() => {
    const loadAllInventory = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        // Check if we already have items
        const count = await db.inventory.count();
        if (count > 1000) return; // Assume already loaded

        let allItems: any[] = [];
        let offset = 0;
        const limit = 500;

        while (true) {
          const res = await fetch(`${API_BASE_URL}/inventory/branch/1?limit=${limit}&offset=${offset}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) break;
          const data = await res.json();
          if (data.length === 0) break;
          allItems.push(...data);
          offset += limit;
          if (data.length < limit) break;
        }

        await db.inventory.clear();
        await db.inventory.bulkAdd(allItems.map(i => ({ ...i, sync_status: "synced", timestamp: Date.now() })));
        console.log(`Loaded ${allItems.length} items in background`);
      } catch (err) {
        console.error("Background inventory load failed:", err);
      }
    };

    loadAllInventory();
  }, []);

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

  // F2 key handler
  useEffect(() => {
    const handleKeyDown = (e: Event) => {
      const keyboardEvent = e as unknown as KeyboardEvent;
      if (keyboardEvent.key === "F2" || keyboardEvent.keyCode === 113) {
        keyboardEvent.preventDefault();
        if (!showInventoryModal) {
          setInventorySearch("");
          setSelectedCategory("");
          setSelectedInventoryIndex(0);
          setInventoryItems([]);
          setCurrentPage(0);
          setHasMore(true);
          setShowInventoryModal(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showInventoryModal]);

  // Clear selected items when modal closes
  useEffect(() => {
    if (!showInventoryModal) {
      setSelectedItems([]);
    }
  }, [showInventoryModal]);

  // Load inventory on search or modal open
  useEffect(() => {
    if (!showInventoryModal) return;

    const loadInventory = async (append = false) => {
      const isSearch = inventorySearch.trim();
      setLoadingMore(append);
      if (!append) setIsLoading(true);
      setError(null);

      try {
        let items: InventoryItem[] = [];
        let newHasMore = true;

        if (isSearch) {
          // Search mode - fetch from server
          if (navigator.onLine) {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("No authentication token found");

            const res = await fetch(`${API_BASE_URL}/inventory/search?name=${encodeURIComponent(inventorySearch)}${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`, {
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
              name: (item.product_name || "Unnamed Product").toLowerCase() === "unnamed" ? "Unnamed Product" : (item.product_name || "Unnamed Product"),
              description: item.product_name_official || "",
              productId: item.product_id,
              batch: item.batch_number || "—",
              expiry: item.expiry_date || null,
              quantity: Number(item.quantity_on_hand) || 0,
              price: Number(item.price) || 0,
              gondola: item.gondola_code || "—",
              category: item.category,
            }));
            newHasMore = false; // Search returns all
          } else {
            // Offline search
            let localItems = await db.inventory
              .where('name').startsWithIgnoreCase(inventorySearch)
              .or('batch').startsWithIgnoreCase(inventorySearch)
              .toArray();
            if (selectedCategory) {
              localItems = localItems.filter(item => item.category === selectedCategory);
            }
            items = localItems.map(item => ({
              id: item.id!,
              name: (item.name || item.product_name_official || "Unnamed Product").toLowerCase() === "unnamed" ? "Unnamed Product" : (item.name || item.product_name_official || "Unnamed Product"),
              description: item.product_name_official || "",
              productId: item.productId,
              batch: item.batch || item.batch_number || "—",
              expiry: item.expiry || item.expiry_date || null,
              quantity: item.quantity || item.quantity_on_hand || 0,
              price: item.price || item.price_regular || 0,
              gondola: item.gondola || item.gondola_code || "—",
            }));
            newHasMore = false;
          }
        } else {
          // Full inventory mode - load from cache first, then sync
          if (navigator.onLine) {
            // Load from cache immediately
            let localItems = await db.inventory.toArray();
            if (selectedCategory) {
              localItems = localItems.filter(item => item.category === selectedCategory);
            }
            items = localItems.slice(0, 50).map(item => ({
              id: item.id!,
              name: (item.product_name || item.name || "Unnamed Product").toLowerCase() === "unnamed" ? "Unnamed Product" : (item.product_name || item.name || "Unnamed Product"),
              description: item.product_name_official || "",
              productId: item.product_id || item.productId,
              batch: item.batch_number || item.batch || "—",
              expiry: item.expiry_date || item.expiry || null,
              quantity: item.quantity_on_hand || item.quantity || 0,
              price: item.price_regular || item.price || 0,
              gondola: item.gondola_code || item.gondola || "—",
            }));
            newHasMore = localItems.length > 50;

            // Then sync with server in background
            setTimeout(async () => {
              try {
                const token = localStorage.getItem("access_token");
                if (!token) return;

                const res = await fetch(`${API_BASE_URL}/inventory/branch/1?limit=50&offset=0${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                  const data = await res.json();
                  // Update cache
                  await db.inventory.clear();
                  await db.inventory.bulkAdd(data.map((i: any) => ({ ...i, sync_status: "synced", timestamp: Date.now() })));
                }
              } catch (err) {
                console.error("Background sync failed:", err);
              }
            }, 0);
          } else {
            // Offline: load from local DB
            let localItems = await db.inventory.toArray();
            if (selectedCategory) {
              localItems = localItems.filter(item => item.category === selectedCategory);
            }
            items = localItems.slice(0, 50).map(item => ({
              id: item.id!,
              name: (item.product_name || item.name || "Unnamed Product").toLowerCase() === "unnamed" ? "Unnamed Product" : (item.product_name || item.name || "Unnamed Product"),
              description: item.product_name_official || "",
              productId: item.product_id || item.productId,
              batch: item.batch_number || item.batch || "—",
              expiry: item.expiry_date || item.expiry || null,
              quantity: item.quantity_on_hand || item.quantity || 0,
              price: item.price_regular || item.price || 0,
              gondola: item.gondola_code || item.gondola || "—",
            }));
            newHasMore = localItems.length > 50;
          }
        }

        setInventoryItems(prev => append ? [...prev, ...items] : items);
        setHasMore(newHasMore);
        if (!append) setCurrentPage(0);
      } catch (err: any) {
        console.error("Inventory load error:", err);
        setError("Could not load inventory. " + (err.message || ""));
        setInventoryItems([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    };

    const debounceTimer = setTimeout(() => loadInventory(), inventorySearch.trim() ? 300 : 0);
    return () => clearTimeout(debounceTimer);
  }, [showInventoryModal, inventorySearch, selectedCategory]);

  // Reset states when modal opens
  useEffect(() => {
    if (showInventoryModal) {
      setInventoryItems([]);
      setCurrentPage(0);
      setHasMore(true);
      setInventorySearch("");
      setSelectedCategory("");
      setSelectedInventoryIndex(0);
      setTimeout(() => inventorySearchRef.current?.focus(), 100);
    }
  }, [showInventoryModal]);
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
          setSelectedCategory("");
          setSelectedInventoryIndex(0);
          setInventoryItems([]);
          setCurrentPage(0);
          setHasMore(true);
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

  // Separate effect for loading more
  useEffect(() => {
    if (currentPage > 0 && showInventoryModal && !inventorySearch.trim()) {
      const loadMore = async () => {
        setLoadingMore(true);
        try {
          let localItems = await db.inventory.toArray();
          if (selectedCategory) {
            localItems = localItems.filter(item => item.category === selectedCategory);
          }
          const limit = 50;
          const offset = currentPage * limit;
          const items = localItems.slice(offset, offset + limit).map(item => ({
            id: item.id!,
            name: item.product_name_official || item.name || "Unnamed Product",
            productId: item.product_id || item.productId,
            batch: item.batch_number || item.batch || "—",
            expiry: item.expiry_date || item.expiry || null,
            quantity: item.quantity_on_hand || item.quantity || 0,
            price: item.price_regular || item.price || 0,
            gondola: item.gondola_code || item.gondola || "—",
          }));

          setInventoryItems(prev => [...prev, ...items]);
          setHasMore(items.length === limit);
        } catch (err) {
          console.error("Load more error:", err);
        } finally {
          setLoadingMore(false);
        }
      };
      loadMore();
    }
  }, [currentPage, showInventoryModal, inventorySearch, selectedCategory]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const amountDue = subtotal - discount + addOn;

  const addItemToSelected = (item: InventoryItem) => {
    setSelectedItems(prev => {
      // Check if item already exists
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        // Update quantity if already exists
        const updated = [...prev];
        const newQuantity = updated[existingIndex].quantity + currentQuantity;
        if (newQuantity > item.quantity) {
          setError(`Cannot add more items. Only ${item.quantity} available.`);
          return prev;
        }
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQuantity,
          total: newQuantity * item.price
        };
        return updated;
      }
      
      // Add new item
      if (currentQuantity > item.quantity) {
        setError(`Not enough stock. Only ${item.quantity} available.`);
        return prev;
      }
      
      const newSelectedItem: SelectedItem = {
        id: item.id,
        name: item.name,
        batch: item.batch,
        price: item.price,
        quantity: currentQuantity,
        total: currentQuantity * item.price,
        stock: item.quantity
      };
      
      return [...prev, newSelectedItem];
    });
  };

  const removeItemFromSelected = (id: number) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const updateSelectedItemQuantity = (id: number, newQuantity: number) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(1, Math.min(newQuantity, item.stock)), total: Math.max(1, Math.min(newQuantity, item.stock)) * item.price }
          : item
      )
    );
  };

  const addSelectedToCart = () => {
    selectedItems.forEach(item => {
      const newCartItem: CartItem = {
        id: Date.now() + Math.random(), // Ensure unique IDs
        description: `${item.name} (${item.batch})`,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        inventoryId: item.id,
      };

      setCartItems(prev => [...prev, newCartItem]);
    });

    setSelectedItems([]);
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
    } else if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      addSelectedToCart();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (inventoryItems[selectedInventoryIndex]) {
        addItemToSelected(inventoryItems[selectedInventoryIndex]);
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

          <CartDisplay
            cartItems={cartItems}
            removeItemFromCart={removeItemFromCart}
            currentItemDescription={currentItemDescription}
            setCurrentItemDescription={setCurrentItemDescription}
            currentQuantity={currentQuantity}
            setCurrentQuantity={setCurrentQuantity}
            currentPrice={currentPrice}
            setCurrentPrice={setCurrentPrice}
            handleKeyPress={handleKeyPress}
            terminalId={terminalId}
            invoiceNo={invoiceNo}
            transNo={transNo}
            setInventorySearch={setInventorySearch}
            setSelectedCategory={setSelectedCategory}
            setSelectedInventoryIndex={setSelectedInventoryIndex}
            setInventoryItems={setInventoryItems}
            setCurrentPage={setCurrentPage}
            setHasMore={setHasMore}
            setShowInventoryModal={setShowInventoryModal}
          />
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

      <InventoryModal
        showInventoryModal={showInventoryModal}
        setShowInventoryModal={setShowInventoryModal}
        inventorySearch={inventorySearch}
        setInventorySearch={setInventorySearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        inventoryItems={inventoryItems}
        isLoading={isLoading}
        selectedInventoryIndex={selectedInventoryIndex}
        setSelectedInventoryIndex={setSelectedInventoryIndex}
        setCurrentPage={setCurrentPage}
        hasMore={hasMore}
        loadingMore={loadingMore}
        inventorySearchRef={inventorySearchRef}
        selectedItemRef={selectedItemRef}
        handleModalKeyDown={handleModalKeyDown}
        addItemToSelected={addItemToSelected}
        selectedItems={selectedItems}
        removeItemFromSelected={removeItemFromSelected}
        updateSelectedItemQuantity={updateSelectedItemQuantity}
        addSelectedToCart={addSelectedToCart}
        CATEGORIES={CATEGORIES}
      />
    </div>
  );
}

export default CashierPosPage;