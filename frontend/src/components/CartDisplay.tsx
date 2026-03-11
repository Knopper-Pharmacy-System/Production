import React from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';

interface CartItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface CartDisplayProps {
  cartItems: CartItem[];
  removeItemFromCart: (id: number) => void;
  currentItemDescription: string;
  setCurrentItemDescription: (desc: string) => void;
  currentQuantity: number;
  setCurrentQuantity: (qty: number) => void;
  currentPrice: string;
  setCurrentPrice: (price: string) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  terminalId: string;
  invoiceNo: string;
  transNo: string;
  setInventorySearch: (search: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedInventoryIndex: (index: number) => void;
  setInventoryItems: (items: any[]) => void;
  setCurrentPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setShowInventoryModal: (show: boolean) => void;
}

const CartDisplay: React.FC<CartDisplayProps> = ({
  cartItems,
  removeItemFromCart,
  currentItemDescription,
  setCurrentItemDescription,
  currentQuantity,
  setCurrentQuantity,
  currentPrice,
  setCurrentPrice,
  handleKeyPress,
  terminalId,
  invoiceNo,
  transNo,
  setInventorySearch,
  setSelectedCategory,
  setSelectedInventoryIndex,
  setInventoryItems,
  setCurrentPage,
  setHasMore,
  setShowInventoryModal,
}) => {
  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
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
              setSelectedCategory("");
              setSelectedInventoryIndex(0);
              setInventoryItems([]);
              setCurrentPage(0);
              setHasMore(true);
              setShowInventoryModal(true);
            }}
            className="bg-white border-2 border-[#062d8c] text-[#062d8c] px-6 py-2 rounded-xl hover:bg-[#f0f4ff] font-semibold flex items-center gap-2"
          >
            <Search className="h-5 w-5" /> Inventory (F2)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDisplay;