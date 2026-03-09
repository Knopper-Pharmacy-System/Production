import { useEffect, useState } from "react";
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
    const newItem: CartItem = {
      id: Date.now(),
      description: currentItemDescription,
      quantity: currentQuantity,
      price: parsedPrice,
      total: currentQuantity * parsedPrice,
    };
    setCartItems((prev) => [...prev, newItem]);
    setCurrentItemDescription("");
    setCurrentQuantity(1);
    setCurrentPrice("");
  };

  const removeItemFromCart = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") addItemToCart();
  };

  return (
    // Fixed: h-screen and overflow-hidden ensures no scrolling
    <div className="h-screen overflow-hidden bg-linear-to-br from-white via-[#e8eeff] to-[#dce7ff] p-4">
      {/* Fixed: Adjusted grid heights to be more compact */}
      <div className="mx-auto grid h-full max-w-[1700px] grid-cols-[1fr_350px] gap-4">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col min-h-0 gap-4">
          <header className="flex shrink-0 items-center justify-between rounded-xl bg-linear-to-r from-[#041848] via-[#062d8c] to-[#3266e6] p-4 shadow-lg">
            <img src={bannerLogo} alt="Knopper" className="h-10 w-auto object-contain" />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase text-white transition hover:bg-white/25"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 backdrop-blur-md">
                <span className="text-xs font-medium uppercase text-[#b9e0ff]">Terminal ID:</span>
                <span className="text-md font-bold text-white">000</span>
              </div>
              <div className={`flex items-center gap-2 rounded-full px-4 py-1 text-white ${isOnline ? "bg-emerald-500" : "bg-red-500"}`}>
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                <span className="text-xs font-semibold uppercase">{isOnline ? "Online" : "Offline"}</span>
              </div>
            </div>
          </header>

          <div className="relative shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-[#041848] via-[#062d8c] to-[#3266e6] p-6 shadow-2xl">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9d9ff]">Amount Due</p>
                <p className="text-5xl font-bold tracking-tight text-white">PHP {amountDue.toFixed(2)}</p>
              </div>
              <ShoppingCart className="h-12 w-12 text-white/20" />
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-4 rounded-xl bg-white/80 p-3 shadow-md backdrop-blur-sm">
            {[["Term ID", terminalId], ["Invoice No.", invoiceNo], ["Trans No.", transNo]].map(([label, val]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">{label}:</span>
                <span className="text-sm font-bold text-slate-900">{val}</span>
              </div>
            ))}
          </div>

          {/* TABLE CONTAINER: min-h-0 and flex-1 allows it to shrink to fit remaining space */}
          <div className="flex flex-1 flex-col min-h-0 overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="shrink-0 border-b border-[#c5d5fb] bg-linear-to-r from-white to-[#e8eeff]">
              <div className="grid grid-cols-[50px_1fr_80px_120px_130px] divide-x divide-[#c5d5fb] text-[11px] font-semibold uppercase text-slate-700">
                <div className="px-3 py-3">#</div>
                <div className="px-3 py-3">Description</div>
                <div className="px-3 py-3 text-center">Qty</div>
                <div className="px-3 py-3 text-center">Price</div>
                <div className="px-3 py-3 text-center">Total</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {cartItems.map((item, index) => (
                <div key={item.id} className="group grid grid-cols-[50px_1fr_80px_120px_130px] divide-x divide-slate-100 border-b border-slate-50 hover:bg-slate-50">
                  <div className="px-3 py-2 text-sm text-slate-500">{index + 1}</div>
                  <div className="px-3 py-2 text-sm font-medium text-slate-900 truncate">{item.description}</div>
                  <div className="px-3 py-2 text-sm text-center">{item.quantity}</div>
                  <div className="px-3 py-2 text-sm text-center text-slate-600">{item.price.toFixed(2)}</div>
                  <div className="flex items-center justify-between px-3 py-2 text-sm font-bold text-[#062d8c]">
                    <span>{item.total.toFixed(2)}</span>
                    <button onClick={() => removeItemFromCart(item.id)} className="text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 rounded-xl bg-white p-4 shadow-xl">
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="grid grid-cols-[1fr_80px_120px_auto] items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Item Description</label>
                  <input type="text" value={currentItemDescription} onChange={(e) => setCurrentItemDescription(e.target.value)} onKeyDown={handleKeyPress} className="rounded-lg border-2 border-slate-100 px-3 py-2 text-sm outline-none focus:border-[#3266e6]" placeholder="Description..." />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Qty</label>
                  <input type="number" value={currentQuantity} onChange={(e) => setCurrentQuantity(parseInt(e.target.value) || 1)} className="rounded-lg border-2 border-slate-100 px-3 py-2 text-sm text-center font-bold outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Price</label>
                  <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} onKeyDown={handleKeyPress} className="rounded-lg border-2 border-slate-100 px-3 py-2 text-sm font-semibold outline-none" placeholder="0.00" />
                </div>
                <div className="pb-2 text-slate-500">
                   <span className="text-[10px] font-bold uppercase block">Items</span>
                   <span className="text-xl font-bold text-[#062d8c] leading-none">{cartItems.length}</span>
                </div>
              </div>
              <button onClick={addItemToCart} className="flex items-center gap-2 self-end rounded-lg bg-[#062d8c] px-6 py-2.5 text-sm font-bold uppercase text-white shadow-md hover:bg-[#041848]">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col min-h-0 gap-4">
          <div className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-br from-[#041848] to-[#3266e6] py-4 shadow-xl">
            <ReceiptIcon className="h-5 w-5 text-white" />
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Receipt</h2>
          </div>

          <div className="shrink-0 space-y-3 rounded-xl bg-white p-4 shadow-xl">
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="font-semibold text-slate-500">Subtotal</span>
              <span className="font-bold">PHP {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b pb-2 text-sm items-center">
              <span className="font-semibold text-red-600">Discount</span>
              <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-20 rounded border-2 border-slate-100 p-1 text-right text-sm font-bold" />
            </div>
            <div className="flex justify-between border-b pb-2 text-sm items-center">
              <span className="font-semibold text-slate-500">Add On</span>
              <input type="number" value={addOn} onChange={(e) => setAddOn(parseFloat(e.target.value) || 0)} className="w-20 rounded border-2 border-slate-100 p-1 text-right text-sm font-bold" />
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-bold text-slate-900">Total Due</span>
              <span className="text-xl font-bold text-[#062d8c]">PHP {amountDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Fixed: Logo section aspect ratio is handled to avoid pushing other content */}
          <div className="relative flex-1 min-h-[150px] overflow-hidden rounded-xl bg-linear-to-br from-[#041848] via-[#062d8c] to-[#3266e6] shadow-xl">
            <div className="absolute inset-0 flex flex-col items-center justify-center scale-75">
              <img src={logoOutline} alt="Logo" className="h-32 w-32 object-contain" />
              <span className="text-2xl font-black text-white">knopper</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#b9e0ff]">Core System</span>
            </div>
          </div>

          <div className="shrink-0 rounded-xl bg-white overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-2">
              <User className="h-4 w-4 text-[#062d8c]" />
              <span className="text-xs font-bold text-slate-700 uppercase">Cashier</span>
            </div>
            <div className="p-4 text-center">
              <p className="text-lg font-bold text-slate-900">{cashierName}</p>
              <div className="mt-2 flex justify-center gap-4 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {currentDate}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {currentTime}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CashierPosPage;