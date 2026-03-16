import React, { useEffect, useRef } from 'react';
import { Search, ShoppingCart } from 'lucide-react';

interface InventoryItem {
  id: number;
  name: string;
  description?: string;
  productId?: number;
  barcode: string;
  expiry: string | null;
  quantity: number;
  price: number;
  gondola: string;
}

interface SelectedItem {
  id: number;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  total: number;
  stock: number;
}

interface Category {
  value: string;
  label: string;
}

type StockFilter = "all-stock" | "in-stock" | "low-stock" | "out-of-stock";

interface InventoryModalProps {
  showInventoryModal: boolean;
  inventorySearch: string;
  setInventorySearch: (search: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  stockFilter: StockFilter;
  setStockFilter: (filter: StockFilter) => void;
  isSearchMode: boolean;
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  selectedInventoryIndex: number;
  setSelectedInventoryIndex: (index: number) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  inventorySearchRef: React.RefObject<HTMLInputElement | null>;
  selectedItemRef: React.RefObject<HTMLDivElement | null>;
  handleModalKeyDown: (e: Pick<globalThis.KeyboardEvent, 'key' | 'ctrlKey' | 'preventDefault'>) => void;
  addItemToSelected: (item: InventoryItem) => void;
  selectedItems: SelectedItem[];
  removeItemFromSelected: (id: number) => void;
  updateSelectedItemQuantity: (id: number, quantity: number) => void;
  addSelectedToCart: () => void;
  CATEGORIES: Category[];
}

const InventoryModal: React.FC<InventoryModalProps> = ({
  showInventoryModal,
  inventorySearch,
  setInventorySearch,
  selectedCategory,
  setSelectedCategory,
  stockFilter,
  setStockFilter,
  isSearchMode,
  inventoryItems,
  isLoading,
  selectedInventoryIndex,
  setSelectedInventoryIndex,
  currentPage,
  setCurrentPage,
  totalPages,
  inventorySearchRef,
  selectedItemRef,
  handleModalKeyDown,
  addItemToSelected,
  selectedItems,
  removeItemFromSelected,
  updateSelectedItemQuantity,
  addSelectedToCart,
  CATEGORIES,
}) => {
  const wheelLockRef = useRef(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showInventoryModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => {
      modalRef.current?.focus();
      inventorySearchRef.current?.focus();
    }, 0);

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isQuantityInput = target instanceof HTMLInputElement && target.type === 'number';

      if (isQuantityInput && event.key !== 'Escape') {
        return;
      }

      if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) {
        return;
      }

      handleModalKeyDown(event);
    };

    window.addEventListener('keydown', handleWindowKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleWindowKeyDown, true);
    };
  }, [showInventoryModal, handleModalKeyDown, inventorySearchRef]);

  if (!showInventoryModal) return null;

  const handleWheelNavigation = (event: React.WheelEvent<HTMLDivElement>) => {
    if (inventoryItems.length === 0) return;

    event.preventDefault();
    event.stopPropagation();

    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 40);

    const direction = event.deltaY > 0 ? 1 : -1;
    if (direction > 0 && selectedInventoryIndex >= inventoryItems.length - 1) {
      if (currentPage + 1 < totalPages) {
        setCurrentPage((page) => page + 1);
        setSelectedInventoryIndex(0);
      }
      return;
    }

    if (direction < 0 && selectedInventoryIndex <= 0) {
      if (currentPage > 0) {
        setCurrentPage((page) => page - 1);
        setSelectedInventoryIndex(Number.MAX_SAFE_INTEGER);
      }
      return;
    }

    setSelectedInventoryIndex(Math.max(0, Math.min(selectedInventoryIndex + direction, inventoryItems.length - 1)));
  };

  const hasPreviousPage = currentPage > 0;
  const hasNextPage = currentPage + 1 < totalPages;

  return (
    <div className="fixed inset-0 bg-[#020b20]/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-blue-200 w-full max-w-[1260px] max-h-[92vh] flex overflow-hidden outline-none"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#041848] to-[#062d8c] px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 text-white">
              <Search className="h-6 w-6" />
              <h2 className="font-bold text-xl uppercase tracking-wide">Inventory Search</h2>
            </div>
            <span className="text-blue-200 text-sm">Esc to close</span>
          </div>

        {/* Search */}
        <div className="p-6 border-b border-blue-100 shrink-0 bg-gradient-to-b from-blue-50/60 to-white">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setSelectedInventoryIndex(0);
                  setCurrentPage(0);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-[#062d8c] text-white shadow-sm"
                    : "bg-slate-200 text-slate-700 hover:bg-blue-100 hover:text-[#062d8c]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Stock</span>
            <button
              onClick={() => setStockFilter("all-stock")}
              disabled={isSearchMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                stockFilter === "all-stock"
                  ? "bg-[#062d8c] text-white"
                  : "bg-blue-100 text-[#12337f] hover:bg-blue-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockFilter("in-stock")}
              disabled={isSearchMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                stockFilter === "in-stock"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStockFilter("low-stock")}
              disabled={isSearchMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                stockFilter === "low-stock"
                  ? "bg-orange-600 text-white"
                  : "bg-orange-100 text-orange-800 hover:bg-orange-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter("out-of-stock")}
              disabled={isSearchMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                stockFilter === "out-of-stock"
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Out of Stock
            </button>
            {isSearchMode && (
              <span className="ml-2 text-xs font-semibold text-[#12337f]">
                Search mode: all stock levels visible
              </span>
            )}
          </div>

          <input
            ref={inventorySearchRef}
            type="text"
            value={inventorySearch}
            onChange={e => { setInventorySearch(e.target.value); setSelectedInventoryIndex(0); setCurrentPage(0); }}
            placeholder="Search product name or barcode..."
            className="w-full px-5 py-4 border-2 border-[#1f4fc4] rounded-xl text-lg text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-300 focus:border-[#062d8c]"
            autoFocus
          />
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[180px_1fr_100px_120px_100px_100px] bg-[#e8eefc] border-b border-blue-200 font-bold text-xs uppercase text-[#12337f] px-2 py-3 shrink-0">
          <div className="px-2">Barcode</div>
          <div className="px-4">Product / Description</div>
          <div className="text-center">Stock</div>
          <div className="text-right pr-4">Price</div>
          <div className="text-center">Expiry</div>
          <div className="text-center">Gondola</div>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1 overscroll-contain bg-white" onWheel={handleWheelNavigation}>
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
              const isOutOfStock = item.quantity <= 0;
              const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              const isNearExpiry = item.expiry && new Date(item.expiry) < thirtyDaysFromNow;

              const rowToneClass = isSelected
                ? "bg-blue-100"
                : idx % 2 === 0
                  ? "bg-white hover:bg-blue-50"
                  : "bg-slate-100/70 hover:bg-blue-100/70";

              const rowStockClass = isOutOfStock
                ? "border-l-4 border-l-red-600"
                : isSelected
                  ? "border-l-4 border-l-blue-600"
                  : "border-l-4 border-l-transparent";

              return (
                <div
                  key={item.id}
                  ref={isSelected ? selectedItemRef : null}
                  onClick={() => {
                    addItemToSelected(item);
                    if (idx === inventoryItems.length - 1 && hasNextPage) {
                      setCurrentPage((page) => page + 1);
                      setSelectedInventoryIndex(0);
                    } else {
                      setSelectedInventoryIndex(idx);
                    }
                  }}
                  className={`grid grid-cols-[180px_1fr_100px_120px_100px_100px] items-center px-2 py-3 border-b border-slate-200 cursor-pointer transition-colors ${rowToneClass} ${rowStockClass}`}
                >
                  <div className="px-2 font-mono text-slate-700 truncate">{item.barcode}</div>
                  <div className="px-4 font-medium">
                    <div className="text-slate-800">{item.name}</div>
                    {item.description && <div className="text-sm text-slate-600 mt-1">{item.description}</div>}
                  </div>
                  <div className={`text-center font-bold ${isOutOfStock ? "text-red-700" : isLowStock ? "text-orange-700" : "text-emerald-700"}`}>
                    {item.quantity}
                  </div>
                  <div className="text-right pr-4 font-bold text-[#062d8c]">
                    ₱{item.price.toFixed(2)}
                  </div>
                  <div className={`text-center ${isNearExpiry ? "text-orange-700 font-semibold" : "text-slate-700"}`}>
                    {item.expiry ? new Date(item.expiry).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) : "—"}
                  </div>
                  <div className="text-center font-mono text-slate-700">{item.gondola}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#eef3ff] border-t border-blue-200 flex items-center justify-between text-xs text-[#26448f] shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" />In Stock</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" />Low Stock</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600" />Out of Stock</span>
            </div>
            <div>
            <kbd className="bg-white border border-blue-200 px-2 py-1 rounded">↑ ↓</kbd> Navigate •
            <kbd className="bg-white border border-blue-200 px-2 py-1 rounded ml-2">Enter</kbd> Select •
            <kbd className="bg-white border border-blue-200 px-2 py-1 rounded ml-2">Ctrl+Enter</kbd> Add to Cart •
            <kbd className="bg-white border border-blue-200 px-2 py-1 rounded ml-2">Esc</kbd> Close
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>{inventoryItems.length} items</span>
            <span>Page {Math.min(currentPage + 1, totalPages)} of {totalPages}</span>
            <button
              onClick={() => {
                if (!hasPreviousPage) return;
                setCurrentPage((page) => page - 1);
                setSelectedInventoryIndex(Number.MAX_SAFE_INTEGER);
              }}
              disabled={!hasPreviousPage}
              className="px-3 py-1 rounded text-xs border border-blue-300 bg-white text-[#12337f] hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => {
                if (!hasNextPage) return;
                setCurrentPage((page) => page + 1);
                setSelectedInventoryIndex(0);
              }}
              disabled={!hasNextPage}
              className="px-3 py-1 bg-[#062d8c] text-white rounded text-xs hover:bg-[#041848] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l border-blue-200 flex flex-col bg-[#f7f9ff]">
          <div className="bg-[#e8eefc] px-6 py-4 border-b border-blue-200 font-bold text-sm text-[#12337f] flex items-center justify-between">
            <div>
              <span>Selected Items ({selectedItems.length})</span>
              {selectedItems.length > 0 && (
                <div className="text-xs font-normal text-slate-700 mt-1">
                  Total: ₱{selectedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                </div>
              )}
            </div>
            {selectedItems.length > 0 && (
              <button
                onClick={addSelectedToCart}
                className="px-4 py-2 bg-[#062d8c] text-white text-sm font-semibold rounded-lg hover:bg-[#041848] transition-colors shadow-sm"
              >
                Add to Cart
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {selectedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <ShoppingCart className="h-8 w-8 opacity-30 mb-2" />
                <p className="text-xs">No items selected</p>
                <p className="text-xs">Press Enter to select items</p>
              </div>
            ) : (
              selectedItems.map((item) => (
                <div key={item.id} className="border-b border-slate-200 p-3 hover:bg-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 truncate">{item.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Barcode: {item.barcode} • Stock: {item.stock}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItemFromSelected(item.id)}
                      className="ml-2 text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600">Qty:</label>
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => updateSelectedItemQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-600">₱{item.price.toFixed(2)} each</div>
                      <div className="font-bold text-sm text-slate-800">₱{item.total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;