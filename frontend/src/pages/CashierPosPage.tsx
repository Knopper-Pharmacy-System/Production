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
import { closeShiftWithBalance, db, getActiveShift, startShift, updateActiveShiftOpeningBalance, verifyManagerPin } from "../api/db"; // Enable Dexie for offline support
import { logout } from "../hooks/useAuth";
import InventoryModal from "../components/InventoryModal";
import CartDisplay from "../components/CartDisplay";
import OpeningBalanceModal from "../components/OpeningBalanceModal";
import ManagerAuthModal from "../components/ManagerAuthModal";
import ClosingBalanceModal from "../components/ClosingBalanceModal";
import CheckoutModal from "../components/CheckoutModal";

const PROD_API_BASE_URL = "https://web-production-2c7737.up.railway.app";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || PROD_API_BASE_URL;

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "MEDICINE", label: "Medicine" },
  { value: "GROCERY", label: "Grocery" },
  { value: "EQUIPMENT", label: "Equipment" },
];

const DISCOUNT_TYPES = [
  "#1",
  "#2",
  "#3",
  "#4",
];

const DISCOUNT_RATES = [0, 0.20, 0.10, 0];

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
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("pos_cartItems");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentItemDescription, setCurrentItemDescription] = useState("");
  const [addOn, setAddOn] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("pos_addOn");
      return saved ? Number(saved) : 0;
    } catch { return 0; }
  });
  const [terminalId] = useState("001");
  const [invoiceNo] = useState("000000001");
  const [transNo] = useState("000000001");
  const [cashierName] = useState(() => localStorage.getItem("cashier_username") || "Cashier");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isEditingOpeningBalance, setIsEditingOpeningBalance] = useState(false);
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [discountTypeIndex, setDiscountTypeIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("pos_discountTypeIndex");
      return saved ? Number(saved) : 0;
    } catch { return 0; }
  });
  const discountTypeLabel = DISCOUNT_TYPES[discountTypeIndex];

  // Manager approval modal state
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isAuthorizingManager, setIsAuthorizingManager] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"discount" | "return" | "payment" | null>(null);
  const [isKeybindHelpOpen, setIsKeybindHelpOpen] = useState(false);
  const [isClosingBalanceOpen, setIsClosingBalanceOpen] = useState(false);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [isReceiptConfirmOpen, setIsReceiptConfirmOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Persist cart state to localStorage
  useEffect(() => { localStorage.setItem("pos_cartItems", JSON.stringify(cartItems)); }, [cartItems]);
  useEffect(() => { localStorage.setItem("pos_addOn", String(addOn)); }, [addOn]);
  useEffect(() => { localStorage.setItem("pos_discountTypeIndex", String(discountTypeIndex)); }, [discountTypeIndex]);

  // Check for active shift on mount.
  useEffect(() => {
    let mounted = true;
    const checkActiveShift = async () => {
      try {
        const active = await getActiveShift();
        if (!mounted) return;

        if (active) {
          setShiftId(active.shiftId);
          setIsDrawerOpen(false);
        } else {
          setIsDrawerOpen(true);
        }
      } catch (err) {
        console.error("Failed to check shift status:", err);
        if (mounted) setIsDrawerOpen(true);
      }
    };

    checkActiveShift();
    return () => {
      mounted = false;
    };
  }, []);

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
      if (isDrawerOpen) return;
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
  }, [showInventoryModal, isDrawerOpen]);

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
        if (e.key === "Tab") {
          const target = e.target as HTMLElement | null;
          const isTypingTarget = Boolean(target?.closest("input, textarea, [contenteditable='true']"));
          if (!isTypingTarget) {
            e.preventDefault();
            setIsKeybindHelpOpen((prev) => !prev);
          }
          return;
        }

        if (isKeybindHelpOpen && e.key === "Escape") {
          e.preventDefault();
          setIsKeybindHelpOpen(false);
          return;
        }

        if (isDrawerOpen) return;

        if (e.ctrlKey && e.key.toLowerCase() === "d") {
          e.preventDefault();
          if (shiftId && !isEditingOpeningBalance && !showInventoryModal && !isManagerModalOpen) {
            setError(null);
            setIsEditingOpeningBalance(true);
          }
          return;
        }

        if (e.ctrlKey && e.key.toLowerCase() === "x") {
          e.preventDefault();
          if (shiftId && !isClosingBalanceOpen && !showInventoryModal && !isManagerModalOpen && !isEditingOpeningBalance) {
            if (cartItems.length > 0) {
              setError("Finish or clear cart before closing shift.");
            } else {
              setError(null);
              setIsClosingBalanceOpen(true);
            }
          }
          return;
        }

        if (e.ctrlKey && e.key === "F3") {
          e.preventDefault();
          setDiscountTypeIndex(i => (i + 1) % DISCOUNT_TYPES.length);
          return;
        }

        if (e.key === "Enter") {
          const target = e.target as HTMLElement | null;
          const isTypingTarget = Boolean(target?.closest("input, textarea, [contenteditable='true']"));
          if (!isTypingTarget && !showInventoryModal && !isManagerModalOpen) {
            e.preventDefault();
            barcodeInputRef.current?.focus();
          }
          return;
        }

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
  }, [cartItems, isDrawerOpen, shiftId, isEditingOpeningBalance, showInventoryModal, isManagerModalOpen, isKeybindHelpOpen, isClosingBalanceOpen, discountTypeIndex]);

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
  const discount = subtotal * DISCOUNT_RATES[discountTypeIndex];
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
    setShowInventoryModal(false);
    setError(null);
  };

  const removeItemFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDirectAddToCart = useCallback((item: { id: number; name: string; batch: string; price: number; stock: number }) => {
    const newCartItem: CartItem = {
      id: Date.now() + Math.random(),
      description: `${item.name} (${item.batch})`,
      quantity: 1,
      price: item.price,
      total: item.price,
      inventoryId: item.id,
    };
    setCartItems(prev => [...prev, newCartItem]);
  }, []);

  const updateCartItemPrice = (id: number, newPrice: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, price: newPrice, total: newPrice * item.quantity } : item
      )
    );
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
    if (isDrawerOpen) {
      setError("Open station first before accepting payments.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Cart is empty");
      return;
    }

    // Discount types #2, #3, #4 require manager approval before showing checkout
    if (discountTypeIndex > 0) {
      setPendingAction("payment");
      setManagerError(null);
      setIsManagerModalOpen(true);
      return;
    }

    setIsCheckoutOpen(true);
  }, [cartItems, isDrawerOpen, discountTypeIndex]);

  const processPayment = useCallback(async () => {
    setIsCheckoutOpen(false);
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Send sale to backend (SALES_HEADERS + SALES_DETAILS)
      await new Promise(r => setTimeout(r, 800));
      setCartItems([]);
      setAddOn(0);
      setDiscountTypeIndex(0);
      localStorage.removeItem("pos_cartItems");
      localStorage.removeItem("pos_addOn");
      localStorage.removeItem("pos_discountTypeIndex");
      setIsReceiptConfirmOpen(true);
    } catch (err) {
      setError("Payment processing failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOpenStation = async (amount: number) => {
    setIsOpeningShift(true);
    setError(null);

    try {
      if (isEditingOpeningBalance) {
        const updated = await updateActiveShiftOpeningBalance(amount);
        if (!updated) {
          setError("No active shift found to update.");
          return;
        }

        setIsEditingOpeningBalance(false);
        setError("Opening balance updated.");
      } else {
        const shift = await startShift(amount);
        setShiftId(shift.shiftId);
        setIsDrawerOpen(false);
      }

      window.setTimeout(() => barcodeInputRef.current?.focus(), 0);
    } catch (err) {
      console.error("Failed to open shift:", err);
      setError(isEditingOpeningBalance ? "Could not update opening balance. Please try again." : "Could not open station. Please try again.");
    } finally {
      setIsOpeningShift(false);
    }
  };

  const handleResetSavedOpeningBalance = async () => {
    setIsOpeningShift(true);
    setError(null);

    try {
      const updated = await updateActiveShiftOpeningBalance(0);
      if (!updated) {
        setError("No active shift found to reset.");
        return;
      }

      setIsEditingOpeningBalance(false);
      setError("Opening balance reset to PHP 0.00.");
      window.setTimeout(() => barcodeInputRef.current?.focus(), 0);
    } catch (err) {
      console.error("Failed to reset opening balance:", err);
      setError("Could not reset opening balance. Please try again.");
    } finally {
      setIsOpeningShift(false);
    }
  };

  const requireManagerApproval = (action: "discount" | "return") => {
    setPendingAction(action);
    setManagerError(null);
    setIsManagerModalOpen(true);
  };

  const handleCloseShift = async (amount: number) => {
    if (!shiftId) {
      setError("No active shift to close.");
      return;
    }

    if (cartItems.length > 0) {
      setError("Finish or clear cart before closing shift.");
      return;
    }

    setIsClosingShift(true);
    setError(null);

    try {
      const closed = await closeShiftWithBalance(shiftId, amount);
      if (!closed) {
        setError("Could not close shift.");
        return;
      }

      setIsClosingBalanceOpen(false);
      setShiftId(null);
      setDiscountTypeIndex(0);
      setAddOn(0);
      localStorage.removeItem("pos_cartItems");
      localStorage.removeItem("pos_addOn");
      localStorage.removeItem("pos_discountTypeIndex");
      setIsDrawerOpen(true);
      setError("Shift closed successfully.");
    } catch (err) {
      console.error("Failed to close shift:", err);
      setError("Could not close shift. Please try again.");
    } finally {
      setIsClosingShift(false);
    }
  };

  const handleManagerAuthorize = async (pin: string) => {
    setIsAuthorizingManager(true);
    setManagerError(null);

    try {
      const isAuthorized = await verifyManagerPin(pin);
      if (!isAuthorized) {
        setManagerError("Unauthorized: invalid manager PIN.");
        return;
      }

      if (pendingAction === "return") {
        setError("Return action authorized. Continue with return workflow.");
      }

      if (pendingAction === "payment") {
        setIsManagerModalOpen(false);
        setPendingAction(null);
        setIsCheckoutOpen(true);
        return;
      }

      setIsManagerModalOpen(false);
      setPendingAction(null);
      window.setTimeout(() => barcodeInputRef.current?.focus(), 0);
    } catch (err) {
      console.error("Manager authorization failed:", err);
      setManagerError("Authorization failed. Try again.");
    } finally {
      setIsAuthorizingManager(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-300 p-6 font-sans">
      <div className={`mx-auto grid h-full max-w-[1800px] grid-cols-[1fr_400px] gap-6 overflow-hidden transition ${(isDrawerOpen || isEditingOpeningBalance || isClosingBalanceOpen) ? "pointer-events-none blur-sm" : ""}`}>

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
            discountTypeLabel={discountTypeLabel}
            discountTypeIndex={discountTypeIndex}
            updateCartItemPrice={updateCartItemPrice}
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
            barcodeInputRef={barcodeInputRef}
            onAddToCart={handleDirectAddToCart}
          />
        </div>

        {/* RIGHT - Summary */}
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          <div className="shrink-0 flex items-center justify-between rounded-2xl bg-white p-6 shadow-lg border border-slate-300">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white"><ReceiptIcon className="h-5 w-5" /></div>
              <h2 className="text-lg font-black text-slate-800 uppercase">Summary</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">#{invoiceNo}</span>
          </div>

          <div className="shrink-0 space-y-4 rounded-3xl bg-white p-8 shadow-xl border border-slate-300">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span><span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-600 font-bold">Discount <span className="text-xs font-normal text-slate-400">({(DISCOUNT_RATES[discountTypeIndex] * 100).toFixed(0)}%)</span></span>
              <span className="font-bold text-red-600">{discount > 0 ? `-${discount.toFixed(2)}` : "0.00"}</span>
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
              {isLoading ? "Processing..." : "PAYMENT"}
            </button>
          </div>

          {/* Branding */}
          <div className="flex-1 min-h-[120px] relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#041848] to-[#3266e6] shadow-xl flex flex-col items-center justify-center p-6">
            <img src={logoOutline} alt="Logo" className="h-20 w-20 opacity-30 mb-4" />
            <p className="text-2xl font-black text-white tracking-tighter">KNOPPER <span className="text-blue-400">POS</span></p>
            <p className="text-[10px] uppercase text-blue-200 tracking-[0.4em] mt-1">Pharmacy Edition</p>
          </div>

          {/* User info */}
          <div className="shrink-0 rounded-2xl bg-white p-6 shadow-xl border border-slate-300">
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

      <OpeningBalanceModal
        isOpen={isDrawerOpen || isEditingOpeningBalance}
        isSubmitting={isOpeningShift}
        onSubmit={handleOpenStation}
        onResetSaved={isEditingOpeningBalance ? handleResetSavedOpeningBalance : undefined}
        title={isEditingOpeningBalance ? "Edit Opening Balance" : "Opening Balance"}
        description={isEditingOpeningBalance ? "Correct the shift opening balance amount." : "Count your bills and coins to start this cashier shift."}
        actionLabel={isEditingOpeningBalance ? "Save Balance" : "Open Station"}
      />

      <ManagerAuthModal
        isOpen={isManagerModalOpen}
        title="Manager PIN Required"
        description={
          pendingAction === "payment"
            ? `Authorize payment with ${DISCOUNT_TYPES[discountTypeIndex]} discount applied.`
            : "Authorize special cashier action."
        }
        isSubmitting={isAuthorizingManager}
        error={managerError}
        onClose={() => {
          setIsManagerModalOpen(false);
          setPendingAction(null);
          setManagerError(null);
        }}
        onAuthorize={handleManagerAuthorize}
      />

      <ClosingBalanceModal
        isOpen={isClosingBalanceOpen}
        isSubmitting={isClosingShift}
        onSubmit={handleCloseShift}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        cartItems={cartItems}
        subtotal={subtotal}
        discount={discount}
        discountTypeLabel={discountTypeLabel}
        discountRate={DISCOUNT_RATES[discountTypeIndex]}
        addOn={addOn}
        amountDue={amountDue}
        isProcessing={isLoading}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirm={processPayment}
      />

      {/* Receipt Confirmation */}
      {isReceiptConfirmOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          tabIndex={-1}
          ref={el => el?.focus()}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); setIsReceiptConfirmOpen(false); /* TODO: trigger receipt print */ }
            if (e.key === "Escape") { e.preventDefault(); setIsReceiptConfirmOpen(false); }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900">Payment Successful</h3>
            <p className="mt-1 mb-6 text-sm text-slate-500">Print a receipt for this transaction?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsReceiptConfirmOpen(false)}
                className="flex-1 rounded-xl border-2 border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  // TODO: trigger receipt print
                  setIsReceiptConfirmOpen(false);
                }}
                className="flex-1 rounded-xl bg-[#062d8c] py-3 font-bold text-white hover:bg-[#041848]"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {isKeybindHelpOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 p-6">
              <h3 className="text-2xl font-black text-slate-900">Keyboard Shortcuts</h3>
              <p className="mt-1 text-sm text-slate-500">Press Tab or Esc to close this guide.</p>
            </div>
            <div className="space-y-2 p-6 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"><span>Open this keybind guide</span><kbd className="rounded bg-slate-900 px-2 py-1 text-xs font-bold text-white">Tab</kbd></div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"><span>Cycle discount type</span><kbd className="rounded bg-slate-900 px-2 py-1 text-xs font-bold text-white">Ctrl + F3</kbd></div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"><span>Open inventory modal</span><kbd className="rounded bg-slate-900 px-2 py-1 text-xs font-bold text-white">F2</kbd></div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"><span>Proceed to payment</span><kbd className="rounded bg-slate-900 px-2 py-1 text-xs font-bold text-white">F12</kbd></div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"><span>Edit opening balance</span><kbd className="rounded bg-slate-900 px-2 py-1 text-xs font-bold text-white">Ctrl + D</kbd></div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"><span>Open close shift modal</span><kbd className="rounded bg-slate-900 px-2 py-1 text-xs font-bold text-white">Ctrl + X</kbd></div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"><span>Close inventory modal</span><kbd className="rounded bg-slate-900 px-2 py-1 text-xs font-bold text-white">Esc</kbd></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashierPosPage;