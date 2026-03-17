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
  category_type?: string;
  classification?: string;
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
  shortName: string;
  longName: string;
  category: string;
  barcode: string;
  price: number;
  priceWholesale: number;
  priceSenior: number;
  priceType: "regular" | "wholesale" | "senior";
  allowDiscount: boolean;
  stock: number;
  location: string;
};

type ProductEditorDraft = ProductRow;

const PROD_API_BASE_URL = "https://web-production-2c7737.up.railway.app";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || PROD_API_BASE_URL;
const BRANCHES: BranchOption[] = [
  { id: 1, label: "BMC MAIN" },
  { id: 2, label: "DIVERSION BRANCH" },
  { id: 3, label: "PANGANIBAN BRANCH" },
];
const CATEGORY_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "MEDICINE", label: "Medicine" },
  { value: "GROCERY", label: "Grocery" },
  { value: "MEDICAL_SUPPLIES", label: "Medical Supplies" },
] as const;
const PAGE_SIZE = 50;
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

const normalizeInventoryCategory = (value?: string) => {
  const normalized = (value || "").trim().toUpperCase();
  if (!normalized) return "";

  if (normalized === "MEDICINE") return "MEDICINE";
  if (normalized === "GROCERY") return "GROCERY";

  if (
    normalized === "EQUIPMENT" ||
    normalized.includes("EQUIP") ||
    normalized.includes("MEDICAL") ||
    normalized.includes("SUPPL") ||
    normalized === "MEDICAL/MEDICINES SUPPLIES" ||
    normalized === "MEDICAL_SUPPLIES" ||
    normalized === "MEDICALSUPPLIES"
  ) {
    return "MEDICAL_SUPPLIES";
  }

  return normalized;
};

const matchesCategoryFilter = (productCategory: string, selectedFilter: string) => {
  if (selectedFilter === "ALL") return true;
  return normalizeInventoryCategory(productCategory) === selectedFilter;
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [editingProduct, setEditingProduct] = useState<ProductEditorDraft | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

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
          shortName: (item.product_name_official || item.product_name || "Unnamed Product").slice(0, 24),
          longName: item.product_name_official || item.product_name || "Unnamed Product",
          category: item.category || item.category_type || item.classification || "Uncategorized",
          barcode: sanitizeBarcode(item.barcode, item.barcode_value),
          price: Number(item.price || 0),
          priceWholesale: Number(item.price || 0),
          priceSenior: Number(item.price || 0),
          priceType: "regular" as const,
          allowDiscount: true,
          stock: Number(item.quantity_on_hand || 0),
          location: item.gondola_code || "—",
        }));
        setProducts(rows);
        setCurrentPage(0);
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
    return products.filter((product) => {
      if (!matchesCategoryFilter(product.category, selectedCategoryFilter)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        product.name,
        product.shortName,
        product.longName,
        product.category,
        product.barcode,
        product.location,
        String(product.productId),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [products, searchQuery, selectedCategoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const paginatedProducts = useMemo(() => {
    const start = safeCurrentPage * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedBranchId, selectedCategoryFilter]);

  const openProductModal = (product: ProductRow) => {
    setEditingProduct({ ...product });
    setIsProductModalOpen(true);
  };

  const saveProductEdit = () => {
    if (!editingProduct) return;
    const sanitizedLongName = editingProduct.longName.trim() || "Unnamed Product";
    const sanitizedShortName = editingProduct.shortName.trim() || sanitizedLongName.slice(0, 24);
    const nextProduct: ProductRow = {
      ...editingProduct,
      longName: sanitizedLongName,
      shortName: sanitizedShortName,
      name: sanitizedLongName,
      price: Number.isFinite(editingProduct.price) ? editingProduct.price : 0,
      priceWholesale: Number.isFinite(editingProduct.priceWholesale) ? editingProduct.priceWholesale : 0,
      priceSenior: Number.isFinite(editingProduct.priceSenior) ? editingProduct.priceSenior : 0,
    };

    setProducts((prev) => prev.map((product) => (product.id === nextProduct.id ? nextProduct : product)));
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

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

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setSelectedCategoryFilter(filter.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                  selectedCategoryFilter === filter.value
                    ? "bg-[#062d8c] text-white"
                    : "bg-white text-[#12337f] border border-[#c7d6fb] hover:bg-blue-50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl" style={TABLE_CARD_STYLE}>
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="bg-[#e8eefb] text-[#062d8c] border-b border-[#dbe3f7]">
                  {['Name', 'Product ID', 'Category', 'Barcode', 'Location', 'Price', 'Stock'].map((label) => <th key={label} className="px-3 py-2.5 text-left text-xs font-bold">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">Loading products...</td></tr> : filteredProducts.length === 0 ? <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">No products found.</td></tr> : paginatedProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    onClick={() => openProductModal(product)}
                    className="cursor-pointer"
                    style={{ background: index % 2 === 0 ? '#f7f9ff' : '#edf2ff' }}
                    title="Click to edit product details"
                  >
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

          <div className="mt-4 flex items-center justify-between rounded-xl border border-[#dbe3f7] bg-white/80 px-4 py-3 text-sm text-[#12337f]">
            <p className="font-semibold">
              Showing {filteredProducts.length === 0 ? 0 : safeCurrentPage * PAGE_SIZE + 1} to {Math.min((safeCurrentPage + 1) * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} products
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                disabled={safeCurrentPage === 0}
                className="rounded-lg border border-[#c7d6fb] bg-white px-3 py-1.5 text-xs font-bold uppercase hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-xs font-bold uppercase tracking-wide text-[#4b5f95]">
                Page {safeCurrentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                disabled={safeCurrentPage >= totalPages - 1}
                className="rounded-lg border border-[#c7d6fb] bg-white px-3 py-1.5 text-xs font-bold uppercase hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {isProductModalOpen && editingProduct ? (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="text-xl font-black text-[#062d8c]">Product Details</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Long Name (Database / POS Search)</label>
                  <input
                    type="text"
                    value={editingProduct.longName}
                    onChange={(event) => setEditingProduct((prev) => (prev ? { ...prev, longName: event.target.value } : prev))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#062d8c]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Short Name (Receipt)</label>
                  <input
                    type="text"
                    value={editingProduct.shortName}
                    onChange={(event) => setEditingProduct((prev) => (prev ? { ...prev, shortName: event.target.value } : prev))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#062d8c]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Regular Price</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(event) => setEditingProduct((prev) => (prev ? { ...prev, price: Number(event.target.value) || 0 } : prev))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#062d8c]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Wholesale Price</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editingProduct.priceWholesale}
                    onChange={(event) => setEditingProduct((prev) => (prev ? { ...prev, priceWholesale: Number(event.target.value) || 0 } : prev))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#062d8c]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Senior Price</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editingProduct.priceSenior}
                    onChange={(event) => setEditingProduct((prev) => (prev ? { ...prev, priceSenior: Number(event.target.value) || 0 } : prev))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#062d8c]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Default Price Type</label>
                  <select
                    value={editingProduct.priceType}
                    onChange={(event) => setEditingProduct((prev) => (prev ? { ...prev, priceType: event.target.value as ProductRow["priceType"] } : prev))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#062d8c]"
                  >
                    <option value="regular">Regular</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>

                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingProduct.allowDiscount}
                      onChange={(event) => setEditingProduct((prev) => (prev ? { ...prev, allowDiscount: event.target.checked } : prev))}
                    />
                    Apply item-level discounts
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-black uppercase text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProductEdit}
                  className="rounded-xl bg-[#062d8c] px-4 py-2 text-xs font-black uppercase text-white hover:bg-[#041848]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <AdminFooter lastSync={lastSync} />
      </div>
    </div>
  );
}
