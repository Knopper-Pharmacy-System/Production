import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../../features/pos/api/db';

function EditablePriceCell({ itemId, price, updateCartItemPrice }: { itemId: number; price: number; updateCartItemPrice: (id: number, price: number) => void }) {
  const [raw, setRaw] = useState(price === 0 ? '' : String(price));

  useEffect(() => {
    setRaw(price === 0 ? '' : String(price));
  }, [price]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      onChange={e => {
        const v = e.target.value;
        if (/^\d*\.?\d*$/.test(v)) setRaw(v);
      }}
      onBlur={() => {
        const parsed = parseFloat(raw);
        const finalPrice = isNaN(parsed) ? 0 : parsed;
        setRaw(finalPrice === 0 ? '' : String(finalPrice));
        updateCartItemPrice(itemId, finalPrice);
      }}
      placeholder="0.00"
      className="w-full text-center font-bold text-orange-600 border-b-2 border-orange-400 bg-transparent outline-none"
    />
  );
}

interface CartItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface SuggestionItem {
  id: number;
  name: string;
  barcode: string;
  price: number;
  stock: number;
}

const getInventoryBarcodeValue = (item: {
  qr?: string;
  qr_code?: string;
  barcode?: string;
  barcode_value?: string;
  barcodeValue?: string;
  product_barcode?: string;
  primary_barcode?: string;
  Barcode?: string;
  BARCODE?: string;
}) => item.barcode || item.barcode_value || item.barcodeValue || item.product_barcode || item.primary_barcode || item.Barcode || item.BARCODE || item.qr || item.qr_code || '—';

interface CartDisplayProps {
  cartItems: CartItem[];
  removeItemFromCart: (id: number) => void;
  currentItemDescription: string;
  setCurrentItemDescription: (desc: string) => void;
  discountTypeLabel: string;
  discountTypeIndex: number;
  updateCartItemPrice: (id: number, price: number) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  terminalId: string;
  invoiceNo: string;
  transNo: string;
  setInventorySearch: (search: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedInventoryIndex: (index: number) => void;
  setInventoryItems: (items: any[]) => void;
  setCurrentPage: (page: number) => void;
  setShowInventoryModal: (show: boolean) => void;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  onAddToCart: (item: SuggestionItem) => void;
}

const CartDisplay: React.FC<CartDisplayProps> = ({
  cartItems,
  removeItemFromCart,
  currentItemDescription,
  setCurrentItemDescription,
  discountTypeLabel,
  discountTypeIndex,
  updateCartItemPrice,
  handleKeyPress,
  terminalId,
  invoiceNo,
  transNo,
  setInventorySearch,
  setSelectedCategory,
  setSelectedInventoryIndex,
  setInventoryItems,
  setCurrentPage,
  setShowInventoryModal,
  barcodeInputRef,
  onAddToCart,
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced inline search
  useEffect(() => {
    const query = currentItemDescription.trim();
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = query.toLowerCase();
        const results = await db.inventory
          .filter(item => {
            const name = (item.product_name_official || item.product_name || item.name || '').toLowerCase();
            const barcode = getInventoryBarcodeValue(item).toLowerCase();
            return name.includes(q) || barcode.includes(q);
          })
          .limit(8)
          .toArray();
        setSuggestions(results.map(item => ({
          id: item.id!,
          name: item.product_name_official || item.product_name || item.name || 'Unnamed',
          barcode: getInventoryBarcodeValue(item),
          price: item.price_regular || item.price || 0,
          stock: item.quantity_on_hand || item.quantity || 0,
        })));
        setShowSuggestions(true);
        setHighlightIdx(0);
      } catch (err) {
        console.error('Suggestion search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [currentItemDescription]);

  const selectSuggestion = useCallback((item: SuggestionItem) => {
    onAddToCart(item);
    setCurrentItemDescription('');
    setSuggestions([]);
    setShowSuggestions(false);
  }, [onAddToCart, setCurrentItemDescription]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectSuggestion(suggestions[highlightIdx]);
        return;
      }
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }
    handleKeyPress(e);
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      {/* IDs */}
      <div className="shrink-0 rounded-2xl border border-slate-300 bg-white p-4 shadow-lg">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-700 whitespace-nowrap">
            <span className="uppercase tracking-wide text-slate-500">Term ID:</span>{" "}
            <span className="text-base font-black text-[#062d8c]">{terminalId}</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-700 whitespace-nowrap">
            <span className="uppercase tracking-wide text-slate-500">Invoice No.:</span>{" "}
            <span className="text-base font-black text-[#062d8c]">{invoiceNo}</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-700 whitespace-nowrap">
            <span className="uppercase tracking-wide text-slate-500">Trans No.:</span>{" "}
            <span className="text-base font-black text-[#062d8c]">{transNo}</span>
          </div>
        </div>
      </div>

      {/* Cart Table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-300">
        <div className="shrink-0 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-[60px_1fr_100px_140px_160px] text-[11px] font-black uppercase tracking-wider text-slate-500 p-4">
            <span>#</span>
            <span>Description / Barcode</span>
            <span className="text-center">Qty</span>
            <span className="text-center">Unit Price</span>
            <span className="text-right pr-8">Total</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {cartItems.map((item, idx) => (
            <div key={item.id} className="group grid grid-cols-[60px_1fr_100px_140px_160px] border-b border-slate-100 p-4 items-center hover:bg-blue-50/50">
              <span className="text-sm font-bold text-slate-400">{idx + 1}</span>
              <span className="font-semibold text-slate-800">{item.description}</span>
              <span className="text-center font-bold text-slate-700">{item.quantity}</span>
              {discountTypeIndex === 3 ? (
                <EditablePriceCell itemId={item.id} price={item.price} updateCartItemPrice={updateCartItemPrice} />
              ) : (
                <span className="text-center text-slate-600">{item.price.toFixed(2)}</span>
              )}
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
      <div className="shrink-0 rounded-2xl bg-white p-6 shadow-xl border border-slate-300">
        <div className="grid grid-cols-[1fr_100px_140px_auto] gap-4 items-end">
          <div className="space-y-1 relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Description</label>
            <input
              ref={barcodeInputRef}
              type="text"
              value={currentItemDescription}
              onChange={e => setCurrentItemDescription(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => { if (currentItemDescription.trim() && suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="Scan or type item..."
              className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 outline-none focus:border-blue-500"
              autoComplete="off"
            />
            {/* Inline search dropdown */}
            {showSuggestions && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
              >
                {isSearching && (
                  <div className="px-4 py-3 text-xs text-slate-400">Searching…</div>
                )}
                {!isSearching && suggestions.length === 0 && (
                  <div className="px-4 py-3 text-xs text-slate-400">No items found</div>
                )}
                {!isSearching && suggestions.map((item, idx) => (
                  <div
                    key={item.id}
                    onMouseDown={() => selectSuggestion(item)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-slate-50 last:border-0 ${
                      idx === highlightIdx ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">Barcode: {item.barcode} &bull; Stock: {item.stock}</p>
                    </div>
                    <span className="ml-4 shrink-0 font-black text-[#062d8c] text-sm">₱{item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 text-center block">Total Qty</label>
            <input
              type="number"
              value={cartItems.reduce((s, i) => s + i.quantity, 0)}
              readOnly
              className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-center font-bold outline-none cursor-default"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Discount Type (Ctrl+F3)</label>
            <input
              type="text"
              value={discountTypeLabel}
              readOnly
              className={`w-full rounded-xl border-2 p-3 font-bold outline-none cursor-default text-center ${
                discountTypeIndex === 0 ? 'bg-slate-50 border-slate-200 text-slate-700' :
                discountTypeIndex === 1 ? 'bg-green-50 border-green-300 text-green-700' :
                discountTypeIndex === 2 ? 'bg-blue-50 border-blue-300 text-blue-700' :
                'bg-orange-50 border-orange-300 text-orange-700'
              }`}
            />
          </div>
          <button
            onClick={() => {
              setInventorySearch("");
              setSelectedCategory("MEDICINE");
              setSelectedInventoryIndex(0);
              setInventoryItems([]);
              setCurrentPage(0);
              setShowInventoryModal(true);
            }}
            className="bg-[#062d8c] text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#041848]"
          >
            <Plus className="h-5 w-5" /> ADD ITEM
          </button>
        </div>

      </div>
    </div>
  );
};

export default CartDisplay;