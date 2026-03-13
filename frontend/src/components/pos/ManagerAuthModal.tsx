import { useState, useRef, useEffect } from "react";

type Props = {
	isOpen: boolean;
	title?: string;
	description?: string;
	isSubmitting?: boolean;
	error?: string | null;
	onClose: () => void;
	onAuthorize: (pin: string) => Promise<void> | void;
};

function ManagerAuthModal({
	isOpen,
	title = "Manager Approval Required",
	description = "Enter manager PIN to continue this action.",
	isSubmitting = false,
	error,
	onClose,
	onAuthorize,
}: Props) {
	const [pin, setPin] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			setPin("");
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const submit = async () => {
		await onAuthorize(pin);
		setPin("");
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
			<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
				<h3 className="text-xl font-black text-slate-900">{title}</h3>
				<p className="mt-1 text-sm text-slate-500">{description}</p>

				<div className="mt-5">
					<label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Manager PIN</label>
					<input
						ref={inputRef}
						type="password"
						value={pin}
						onChange={(event) => setPin(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								submit();
							}
						}}
						placeholder="Enter PIN"
						className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold tracking-[0.3em] outline-none focus:border-blue-500"
					/>
				</div>

				{error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

				<div className="mt-6 flex justify-end gap-3">
					<button
						type="button"
						disabled={isSubmitting}
						onClick={onClose}
						className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={isSubmitting || pin.trim().length === 0}
						onClick={submit}
						className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isSubmitting ? "Authorizing..." : "Authorize"}
					</button>
				</div>
			</div>
		</div>
	);
}

export default ManagerAuthModal;
