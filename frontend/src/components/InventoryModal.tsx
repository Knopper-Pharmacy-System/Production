import React from 'react';
import { Search, ShoppingCart } from 'lucide-react';

interface InventoryItem {
  id: number;
  name: string;
  description?: string;
  productId?: number;
  batch: string;
  expiry: string | null;
  quantity: number;
  price: number;
  gondola: string;
}

interface SelectedItem {
  id: number;
  name: string;
  batch: string;
  price: number;
  quantity: number;
  total: number;
  stock: number;
}

interface Category {
  value: string;
  label: string;
}

interface InventoryModalProps {
  showInventoryModal: boolean;
  setShowInventoryModal: (show: boolean) => void;
  inventorySearch: string;
  setInventorySearch: (search: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  selectedInventoryIndex: number;
  setSelectedInventoryIndex: (index: number) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  hasMore: boolean;
  loadingMore: boolean;
  inventorySearchRef: React.RefObject<HTMLInputElement | null>;
  selectedItemRef: React.RefObject<HTMLDivElement | null>;
  handleModalKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  addItemToSelected: (item: InventoryItem) => void;
  selectedItems: SelectedItem[];
  removeItemFromSelected: (id: number) => void;
  updateSelectedItemQuantity: (id: number, quantity: number) => void;
  addSelectedToCart: () => void;
  CATEGORIES: Category[];
}

const InventoryModal: React.FC<InventoryModalProps> = ({
  showInventoryModal,
  setShowInventoryModal,
  inventorySearch,
  setInventorySearch,
  selectedCategory,
  setSelectedCategory,
  inventoryItems,
  isLoading,
  selectedInventoryIndex,
  setSelectedInventoryIndex,
  setCurrentPage,
  hasMore,
  loadingMore,
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
  if (!showInventoryModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInventoryModal(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-8xl max-h-[95vh] flex overflow-hidden" onClick={e => e.stopPropagation()}>
        
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
        <div className="p-6 border-b shrink-0">
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
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
            {selectedCategory && (
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setSelectedInventoryIndex(0);
                  setCurrentPage(0);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          <input
            ref={inventorySearchRef}
            type="text"
            value={inventorySearch}
            onChange={e => { setInventorySearch(e.target.value); setSelectedInventoryIndex(0); setCurrentPage(0); }}
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
              const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              const isNearExpiry = item.expiry && new Date(item.expiry) < thirtyDaysFromNow;

              return (
                <div
                  key={item.id}
                  ref={isSelected ? selectedItemRef : null}
                  onClick={() => addItemToSelected(item)}
                  className={`grid grid-cols-[3fr_140px_100px_120px_100px_100px] items-center px-2 py-3 border-b cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-100 border-l-4 border-l-blue-600" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="px-4 font-medium">
                    <div>{item.name}</div>
                    {item.description && <div className="text-sm text-slate-500 mt-1">{item.description}</div>}
                  </div>
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
            <kbd className="bg-slate-200 px-2 py-1 rounded ml-2">Enter</kbd> Select •
            <kbd className="bg-slate-200 px-2 py-1 rounded ml-2">Ctrl+Enter</kbd> Add to Cart •
            <kbd className="bg-slate-200 px-2 py-1 rounded ml-2">Esc</kbd> Close
          </div>
          <div className="flex items-center gap-2">
            <span>{inventoryItems.length} items</span>
            {hasMore && !inventorySearch.trim() && navigator.onLine && (
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={loadingMore}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 border-l border-slate-200 flex flex-col bg-slate-50">
          <div className="bg-slate-100 px-6 py-4 border-b font-bold text-sm text-slate-700 flex items-center justify-between">
            <div>
              <span>Selected Items ({selectedItems.length})</span>
              {selectedItems.length > 0 && (
                <div className="text-xs font-normal text-slate-600 mt-1">
                  Total: ₱{selectedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                </div>
              )}
            </div>
            {selectedItems.length > 0 && (
              <button
                onClick={addSelectedToCart}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
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
                        Batch: {item.batch} • Stock: {item.stock}
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