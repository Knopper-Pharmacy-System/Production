import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, PackageSearch, RefreshCw, Search, ScanBarcode, Tag } from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminFooter from "../../components/admin/AdminFooter";
import { getToken } from "../../hooks/useAuth";

type BranchOption = { id: number; label: string };
type ApiInventoryItem = {
  inventory_id: number;
  product_id: number;
  product_name?: string;
  product_name_official?: string;
  category?: string;
  barcode?: string | null;
  barcode_value?: string | null;
  quantity_on_hand: number;
  price?: number;
  gondola_code?: string | null;
};
type ProductRow = {
  id: number;
  productId: number;
  name: string;
  category: string;
  barcode: string;
  price: number;
  stock: number;
  location: string;
};

const PROD_API_BASE_URL = "https://web-production-2c7737.up.railway.app";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || PROD_API_BASE_URL;
const BRANCHES: BranchOption[] = [
  { id: 1, label: "BMC MAIN" },
  { id: 2, label: "DIVERSION BRANCH" },
  { id: 3, label: "PANGANIBAN BRANCH" },
];
const PANEL_CARD_STYLE = {
  background: "linear-gradient(180deg, rgba(250,252,255,0.98) 0%, rgba(233,240,253,0.95) 100%)",
  border: "1px solid rgba(77,108,196,0.22)",
  boxShadow: "0 18px 48px rgba(1,24,84,0.16), inset 0 1px 0 rgba(255,255,255,0.88)",
};
const METRIC_CARD_STYLE = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(233,241,255,0.96) 100%)",
  border: "1px solid rgba(77,108,196,0.24)",
  boxShadow: "0 18px 42px rgba(1,24,84,0.18), inset 0 1px 0 rgba(255,255,255,0.88)",
};
const TABLE_CARD_STYLE = {
  border: "1px solid rgba(115,139,205,0.24)",
  background: "linear-gradient(180deg, #ffffff 0%, #f4f7ff 100%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 28px rgba(11,37,97,0.09)",
};

const sanitizeBarcode = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed && !/^[-‐‑–—―\s]+$/u.test(trimmed) && /[0-9A-Z]/i.test(trimmed)) {
      return trimmed;
    }
  }
  return "No Barcode";
};

export default function AdminProductsPage() {
  const [searchParams] = useSearchParams();
  const initialBranchId = Number(searchParams.get("branch") || "1");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastSync, setLastSync] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(Number.isFinite(initialBranchId) ? initialBranchId : 1);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
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

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (!token) {
          setError("No auth token found. Please log in again.");
          setProducts([]);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/inventory/branch/${selectedBranchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) {
          setError(payload.message || payload.error || "Failed to load products.");
          setProducts([]);
          return;
        }
        const rows = (Array.isArray(payload) ? payload : []).map((item: ApiInventoryItem) => ({
          id: Number(item.inventory_id),
          productId: Number(item.product_id || item.inventory_id),
          name: item.product_name_official || item.product_name || "Unnamed Product",
          category: item.category || "Uncategorized",
          barcode: sanitizeBarcode(item.barcode, item.barcode_value),
          price: Number(item.price || 0),
          stock: Number(item.quantity_on_hand || 0),
          location: item.gondola_code || "—",
        }));
        setProducts(rows);
        setLastSync(new Date());
      } catch {
        setError("Network error while loading products.");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    void loadProducts();
  }, [refreshVersion, selectedBranchId]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.category, product.barcode, product.location, String(product.productId)]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [products, searchQuery]);

  const totalStock = filteredProducts.reduce((sum, product) => sum + product.stock, 0);
  const totalValue = filteredProducts.reduce((sum, product) => sum + product.stock * product.price, 0);
  const noBarcodeCount = filteredProducts.filter((product) => product.barcode === "No Barcode").length;
  const selectedBranchLabel = BRANCHES.find((branch) => branch.id === selectedBranchId)?.label || "Unknown Branch";

  return (
    <div className="min-h-screen w-full overflow-y-auto overflow-x-hidden relative" style={{ background: "radial-gradient(circle at top left, rgba(113,160,255,0.18) 0%, transparent 26%), radial-gradient(circle at top right, rgba(11,49,153,0.28) 0%, transparent 30%), linear-gradient(180deg, #041f63 0%, #0b3499 42%, #2c63e0 100%)" }}>
      <div className="absolute inset-x-0 top-0 h-[320px] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)" }} />
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(124, 160, 255, 0.18)" }} />
      <div className="absolute top-40 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(8, 29, 96, 0.22)" }} />

      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeItem="Products" />
      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-5">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} currentTime={currentTime} lastSync={lastSync} isOnline={isOnline} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.35em] uppercase" style={{ color: "rgba(216,231,255,0.66)" }}>Products Workspace</p>
            <h2 className="font-bold text-2xl tracking-wide mt-1" style={{ color: "rgba(245,249,255,0.96)" }}>Product Catalog</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(218,232,255,0.74)" }}>Branch catalog, barcode coverage, pricing, and stock visibility.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center gap-2 h-11 px-4 rounded-2xl" style={{ minWidth: "220px", background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(226,235,255,0.93) 100%)", border: "1px solid rgba(112,136,214,0.34)", boxShadow: "0 16px 32px rgba(3,31,99,0.22), inset 0 1px 0 rgba(255,255,255,0.85)" }}>
              <p className="font-semibold text-sm truncate flex-1 text-center text-[#103182]">{selectedBranchLabel}</p>
              <ChevronDown size={16} className="text-[#103182] shrink-0" />
              <select value={selectedBranchId} onChange={(event) => setSelectedBranchId(Number(event.target.value))} className="absolute inset-0 opacity-0 cursor-pointer">
                {BRANCHES.map((branch) => <option key={branch.id} value={branch.id}>{branch.label}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setRefreshVersion((value) => value + 1)} className="h-11 px-4 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-2" style={{ background: "linear-gradient(180deg, #2449ff 0%, #1133f2 100%)", border: "1px solid rgba(183,205,255,0.28)", boxShadow: "0 12px 24px rgba(2,24,95,0.28)" }}><RefreshCw size={15} /> Refresh</button>
          </div>
        </div>

        {error ? <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(255,255,255,0.14)", color: "#f4f7ff", border: "1px solid rgba(255,255,255,0.3)" }}>{error}</div> : null}

        <div className="rounded-[28px] p-5 sm:p-6" style={PANEL_CARD_STYLE}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}><p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>Products</p><p className="mt-2 leading-none" style={{ color: "#062d8c", fontSize: "3rem", fontWeight: 800 }}>{filteredProducts.length}</p><div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><PackageSearch size={14} /> Searchable SKUs</div></div>
            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}><p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>Units</p><p className="mt-2 leading-none" style={{ color: "#1536ef", fontSize: "3rem", fontWeight: 800 }}>{totalStock.toLocaleString()}</p><div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><Tag size={14} /> On-hand quantity</div></div>
            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}><p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>Catalog Value</p><p className="mt-2 leading-none" style={{ color: "#00a83d", fontSize: "2.2rem", fontWeight: 800 }}>{`₱${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</p><div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><Tag size={14} /> Stock × price</div></div>
            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}><p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>No Barcode</p><p className="mt-2 leading-none" style={{ color: "#c89400", fontSize: "3rem", fontWeight: 800 }}>{noBarcodeCount}</p><div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><ScanBarcode size={14} /> Needs barcode setup</div></div>
          </div>

          <div className="mb-4 flex h-11 max-w-sm items-center gap-2 rounded-2xl px-4" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(242,246,255,0.94) 100%)", border: "1px solid rgba(112,136,214,0.28)" }}>
            <Search size={14} className="text-[#707070]" />
            <input type="text" placeholder="Search product, barcode, category..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="flex-1 bg-transparent text-sm outline-none text-[#001d63]" />
          </div>

          <div className="overflow-x-auto rounded-xl" style={TABLE_CARD_STYLE}>
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="bg-[#e8eefb] text-[#062d8c] border-b border-[#dbe3f7]">
                  {['Name', 'Product ID', 'Category', 'Barcode', 'Location', 'Price', 'Stock'].map((label) => <th key={label} className="px-3 py-2.5 text-left text-xs font-bold">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">Loading products...</td></tr> : filteredProducts.length === 0 ? <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">No products found.</td></tr> : filteredProducts.map((product, index) => (
                  <tr key={product.id} style={{ background: index % 2 === 0 ? '#f7f9ff' : '#edf2ff' }}>
                    <td className="px-3 py-2 text-[#001d63] font-semibold">{product.name}</td>
                    <td className="px-3 py-2 text-[#001d63]">{product.productId}</td>
                    <td className="px-3 py-2 text-[#001d63]">{product.category}</td>
                    <td className="px-3 py-2 text-[#001d63] font-mono">{product.barcode}</td>
                    <td className="px-3 py-2 text-[#001d63]">{product.location}</td>
                    <td className="px-3 py-2 text-[#001d63]">{product.price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-[#001d63]">{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <AdminFooter lastSync={lastSync} />
      </div>
    </div>
  );
}
