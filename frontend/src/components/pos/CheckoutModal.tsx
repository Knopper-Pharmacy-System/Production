import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { ShoppingCart } from "lucide-react";

type CartItem = {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
};

type CheckoutModalProps = {
  isOpen: boolean;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  discountTypeLabel: string;
  discountRate: number;
  addOn: number;
  amountDue: number;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (tendered: number) => void;
};

const CheckoutModal: FC<CheckoutModalProps> = ({
  isOpen,
  cartItems,
  subtotal,
  discount,
  discountTypeLabel,
  discountRate,
  addOn,
  amountDue,
  isProcessing,
  onClose,
  onConfirm,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const tenderRef = useRef<HTMLInputElement>(null);
  const [tenderInput, setTenderInput] = useState("");

  const tendered = parseFloat(tenderInput) || 0;
  const change = tendered - amountDue;
  const canConfirm = tendered >= amountDue;

  useEffect(() => {
    if (isOpen) {
      setTenderInput("");
      setTimeout(() => tenderRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !isProcessing && canConfirm) { e.preventDefault(); onConfirm(tendered); }
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Confirm Payment</h3>
            <p className="text-xs text-slate-400">Review items before confirming</p>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-2 pr-4">Item</th>
                <th className="pb-2 w-16 text-center">Qty</th>
                <th className="pb-2 w-28 text-right">Unit Price</th>
                <th className="pb-2 w-28 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cartItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-4 text-slate-700 leading-tight">{item.description}</td>
                  <td className="py-2 w-16 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-2 w-28 text-right text-slate-600">{item.price.toFixed(2)}</td>
                  <td className="py-2 w-28 text-right font-bold text-slate-800">{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-red-600 font-semibold">
              <span>Discount {discountTypeLabel} ({(discountRate * 100).toFixed(0)}%)</span>
              <span>−₱{discount.toFixed(2)}</span>
            </div>
          )}
          {addOn !== 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Add-on</span>
              <span>{addOn >= 0 ? "+" : ""}₱{addOn.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
            <span className="text-base font-black text-slate-800 uppercase tracking-wide">Amount Due</span>
            <span className="text-2xl font-black text-[#062d8c]">₱{amountDue.toFixed(2)}</span>
          </div>
        </div>

        {/* Cash Tendered */}
        <div className="border-t border-slate-200 px-6 py-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-black uppercase tracking-wide text-slate-700 shrink-0">Cash Tendered</label>
            <input
              ref={tenderRef}
              type="number"
              min={0}
              step="0.01"
              value={tenderInput}
              onChange={(e) => setTenderInput(e.target.value)}
              placeholder={`≥ ₱${amountDue.toFixed(2)}`}
              className="w-48 rounded-xl border-2 border-slate-300 px-4 py-2 text-right text-lg font-black outline-none focus:border-[#062d8c]"
            />
          </div>
          {tendered > 0 && (
            <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${change >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
              <span className={`text-sm font-black uppercase tracking-wide ${change >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {change >= 0 ? "Change" : "Insufficient"}
              </span>
              <span className={`text-2xl font-black ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                ₱{Math.abs(change).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 rounded-xl border-2 border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(tendered)}
            disabled={isProcessing || !canConfirm}
            className="flex-1 rounded-xl bg-emerald-600 py-3 font-black text-white shadow hover:bg-emerald-700 disabled:opacity-50"
          >
            {isProcessing ? "Processing…" : "Confirm Payment"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CheckoutModal;
