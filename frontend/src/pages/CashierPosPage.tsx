import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Calendar,
  Clock,
  LogOut,
  Plus,
  Receipt as ReceiptIcon,
  ShoppingCart,
  Trash2,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import logoOutline from "../assets/logo_outline.png";
import bannerLogo from "../assets/banner_logo.png";
import { logout } from "../hooks/useAuth";

type CartItem = {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
};

function CashierPosPage() {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: 1, description: "Biogesic 500mg (10s)", quantity: 2, price: 45.0, total: 90.0 },
    { id: 2, description: "Neozep Forte Tablet (10s)", quantity: 1, price: 68.5, total: 68.5 },
    { id: 3, description: "Kremil-S Antacid (12s)", quantity: 3, price: 55.0, total: 165.0 },
    { id: 4, description: "Alaxan FR Caplet (10s)", quantity: 2, price: 89.75, total: 179.5 },
    { id: 5, description: "Ceelin Plus Syrup 60mL", quantity: 1, price: 125.0, total: 125.0 },
    { id: 6, description: "Ascorbic Acid (100s)", quantity: 1, price: 350.0, total: 350.0 },
  ]);
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

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const amountDue = subtotal - discount + addOn;

  const addItemToCart = () => {
    if (!currentItemDescription || !currentPrice) return;
    const parsedPrice = Number.parseFloat(currentPrice);
    if (Number.isNaN(parsedPrice)) return;
    const newItem: CartItem = { id: Date.now(), description: currentItemDescription, quantity: currentQuantity, price: parsedPrice, total: currentQuantity * parsedPrice };
    setCartItems((prev) => [...prev, newItem]);
    setCurrentItemDescription("");
    setCurrentQuantity(1);
    setCurrentPrice("");
  };

  const removeItemFromCart = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") addItemToCart();
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-100 p-6 font-sans">
      <div className="mx-auto grid h-full max-w-[1800px] grid-cols-[1fr_400px] gap-6 overflow-hidden">
        
        {/* --- LEFT COLUMN: MAIN TRANSACTION AREA --- */}
        <div className="flex flex-col gap-6 overflow-hidden h-full">
          
          {/* Header Section */}
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
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </header>

          {/* Amount Display */}
          <div className="shrink-0 rounded-2xl bg-[#062d8c] p-8 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Amount Due</p>
            <p className="text-7xl font-black text-white">
              <span className="mr-2 text-3xl font-light text-blue-400">PHP</span>
              {amountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Table Container - Only the rows scroll */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="shrink-0 border-b border-slate-100 bg-slate-50">
              <div className="grid grid-cols-[60px_1fr_100px_150px_150px] text-[11px] font-black uppercase tracking-wider text-slate-500 p-4">
                <span>#</span>
                <span>Item Description</span>
                <span className="text-center">Qty</span>
                <span className="text-center">Unit Price</span>
                <span className="text-right pr-8">Total</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {cartItems.map((item, index) => (
                <div key={item.id} className="group grid grid-cols-[60px_1fr_100px_150px_150px] border-b border-slate-50 p-4 items-center transition-colors hover:bg-blue-50/50">
                  <span className="text-sm font-bold text-slate-400">{index + 1}</span>
                  <span className="font-semibold text-slate-800">{item.description}</span>
                  <span className="text-center font-bold text-slate-700">{item.quantity}</span>
                  <span className="text-center text-slate-600">{item.price.toFixed(2)}</span>
                  <div className="flex items-center justify-end gap-4 font-bold text-[#062d8c]">
                    <span>{item.total.toFixed(2)}</span>
                    <button onClick={() => removeItemFromCart(item.id)} className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Panel */}
          <div className="shrink-0 rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="grid grid-cols-[1fr_100px_150px_auto] gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Description</label>
                <input type="text" value={currentItemDescription} onChange={(e) => setCurrentItemDescription(e.target.value)} onKeyDown={handleKeyPress} placeholder="Scan or type item..." className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 text-center block">Qty</label>
                <input type="number" value={currentQuantity} onChange={(e) => setCurrentQuantity(parseInt(e.target.value) || 1)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-center font-bold outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Price</label>
                <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} onKeyDown={handleKeyPress} placeholder="0.00" className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 font-bold outline-none focus:border-blue-500" />
              </div>
              <button onClick={addItemToCart} className="bg-[#062d8c] text-white px-8 py-3.5 rounded-xl font-bold flex gap-2 hover:bg-[#041848] transition-all shadow-lg active:scale-95">
                <Plus className="w-5 h-5" /> ADD ITEM
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: SUMMARY & DETAILS --- */}
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white"><ReceiptIcon className="h-5 w-5" /></div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Summary</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">#{invoiceNo}</span>
          </div>

          {/* Payment Details */}
          <div className="shrink-0 space-y-4 rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-red-500">
              <span className="font-bold">Discount</span>
              <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 text-right font-bold bg-red-50 border-none rounded-lg p-1.5 focus:ring-0" />
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-bold">Add-on</span>
              <input type="number" value={addOn} onChange={(e) => setAddOn(parseFloat(e.target.value) || 0)} className="w-24 text-right font-bold bg-slate-100 border-none rounded-lg p-1.5 focus:ring-0" />
            </div>
            <div className="h-px bg-slate-100 my-2" />
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold uppercase text-slate-400">Total</span>
              <span className="text-3xl font-black text-[#062d8c]">PHP {amountDue.toFixed(2)}</span>
            </div>
            <button className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg shadow-emerald-200 shadow-lg hover:bg-emerald-600 active:scale-95 transition-all mt-4">
              PAYMENT (F12)
            </button>
          </div>

          {/* Branding Area: Uses flex-1 and shrink to adapt to screen height */}
          <div className="flex-1 min-h-[120px] relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#041848] to-[#3266e6] shadow-xl flex flex-col items-center justify-center p-6 text-center">
             <img src={logoOutline} alt="Logo" className="h-20 w-20 opacity-30 mb-4" />
             <p className="text-2xl font-black text-white tracking-tighter">KNOPPER <span className="text-blue-400">POS</span></p>
             <p className="text-[10px] uppercase text-blue-200 tracking-[0.4em] mt-1">Pharmacy Edition</p>
          </div>

          {/* User & Info Footer */}
          <div className="shrink-0 rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-[#062d8c]">
                <User />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Active Cashier</p>
                <p className="font-black text-slate-800">{cashierName}</p>
              </div>
            </div>
            <div className="flex justify-between gap-4 text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-xl">
               <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500"/> {currentDate}</span>
               <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500"/> {currentTime}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CashierPosPage;