import { useMemo, useRef, useState } from "react";

type Props = {
	isOpen: boolean;
	isSubmitting?: boolean;
	onSubmit: (amount: number) => Promise<void> | void;
	onResetSaved?: () => Promise<void> | void;
	lastClosingBalance?: number | null;
	title?: string;
	description?: string;
	actionLabel?: string;
};

const DENOMINATIONS = [10000, 1000, 500, 200, 100, 50, 20, 10, 5, 1] as const;

function OpeningBalanceModal({
	isOpen,
	isSubmitting = false,
	onSubmit,
	onResetSaved,
	lastClosingBalance,
	title = "Opening Balance",
	description = "Count your bills and coins to start this cashier shift.",
	actionLabel = "Open Station",
}: Props) {
	const [counts, setCounts] = useState<Record<number, number>>({});
	const [error, setError] = useState<string | null>(null);
	const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

	const rows = useMemo(
		() =>
			DENOMINATIONS.map((denomination) => {
				const count = counts[denomination] || 0;
				return {
					denomination,
					count,
					subtotal: denomination * count,
				};
			}),
		[counts],
	);

	const totalFloat = useMemo(
		() => rows.reduce((sum, row) => sum + row.subtotal, 0),
		[rows],
	);

	if (!isOpen) return null;

	const onCountChange = (denomination: number, value: string) => {
		if (value === "") {
			setCounts((prev) => {
				const next = { ...prev };
				delete next[denomination];
				return next;
			});
			return;
		}

		const parsed = Number.parseInt(value, 10);
		setCounts((prev) => ({
			...prev,
			[denomination]: Number.isNaN(parsed) || parsed < 0 ? 0 : parsed,
		}));
	};

	const focusNextInput = (index: number) => {
		const isLast = index >= DENOMINATIONS.length - 1;
		if (isLast) {
			handleSubmit();
			return;
		}

		inputRefs.current[index + 1]?.focus();
		inputRefs.current[index + 1]?.select();
	};

	const handleSubmit = async () => {
		if (totalFloat <= 0) {
			setError("Enter at least one denomination before continuing.");
			return;
		}

		setError(null);
		await onSubmit(totalFloat);
	};

	const handleReset = () => {
		setCounts({});
		setError(null);
		inputRefs.current[0]?.focus();
	};

	const handleLoadData = () => {
		if (lastClosingBalance == null || lastClosingBalance <= 0) return;
		// Distribute the closing balance into denominations (largest first)
		let remaining = Math.round(lastClosingBalance);
		const newCounts: Record<number, number> = {};
		for (const denom of DENOMINATIONS) {
			if (remaining <= 0) break;
			const count = Math.floor(remaining / denom);
			if (count > 0) {
				newCounts[denom] = count;
				remaining -= count * denom;
			}
		}
		setCounts(newCounts);
		setError(null);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
			<div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
				<div className="border-b border-slate-200 p-6">
					<h2 className="text-2xl font-black text-slate-900">{title}</h2>
					<p className="mt-1 text-sm text-slate-500">{description}</p>
				</div>

				<div className="max-h-[58vh] overflow-y-auto p-6">
					<div className="grid grid-cols-[140px_1fr_1fr] gap-3 rounded-xl bg-slate-100 p-3 text-xs font-bold uppercase tracking-wide text-slate-500">
						<div>Denomination</div>
						<div className="text-center">Count</div>
						<div className="text-right">Subtotal</div>
					</div>

					<div className="mt-3 space-y-2">
						{rows.map((row, index) => (
							<div key={row.denomination} className="grid grid-cols-[140px_1fr_1fr] items-center gap-3 rounded-xl border border-slate-200 p-3">
								<div className="font-bold text-slate-800">PHP {row.denomination}</div>
								<input
									ref={(element) => {
										inputRefs.current[index] = element;
									}}
									type="number"
									min={0}
									value={row.count === 0 ? "" : row.count}
									onChange={(event) => onCountChange(row.denomination, event.target.value)}
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											focusNextInput(index);
										}
									}}
									onFocus={(event) => event.currentTarget.select()}
									placeholder="0"
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-semibold outline-none focus:border-blue-500"
								/>
								<div className="text-right font-bold text-slate-700">PHP {row.subtotal.toFixed(2)}</div>
							</div>
						))}
					</div>

					<div className="mt-5 rounded-xl bg-blue-50 p-4">
						<div className="flex items-end justify-between">
							<span className="text-sm font-bold uppercase tracking-wide text-blue-700">Total Float</span>
							<span className="text-3xl font-black text-blue-900">PHP {totalFloat.toFixed(2)}</span>
						</div>
					</div>

					{error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
				</div>

				<div className="flex justify-end gap-3 border-t border-slate-200 p-6">
					<button
						type="button"
						disabled={isSubmitting}
						onClick={handleReset}
						className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-black uppercase tracking-wide text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Reset
					</button>
					{lastClosingBalance != null && lastClosingBalance > 0 && (
						<button
							type="button"
							disabled={isSubmitting}
							onClick={handleLoadData}
							className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-3 text-sm font-black uppercase tracking-wide text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Load Data (₱{lastClosingBalance.toFixed(2)})
						</button>
					)}
					{onResetSaved && (
						<button
							type="button"
							disabled={isSubmitting}
							onClick={() => {
								setCounts({});
								setError(null);
								void onResetSaved();
							}}
							className="rounded-xl border border-red-300 bg-red-50 px-6 py-3 text-sm font-black uppercase tracking-wide text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Reset Saved
						</button>
					)}
					<button
						type="button"
						disabled={isSubmitting}
						onClick={handleSubmit}
						className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isSubmitting ? "Saving..." : actionLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

export default OpeningBalanceModal;
