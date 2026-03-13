import { useEffect, useRef, useState } from "react";

type Props = {
  isOpen: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onUnlock: (password: string) => Promise<void> | void;
};

function TerminalLockModal({
  isOpen,
  isSubmitting = false,
  error,
  onUnlock,
}: Props) {
  const [password, setPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async () => {
    await onUnlock(password);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-black text-slate-900">Terminal Locked</h3>
        <p className="mt-1 text-sm text-slate-500">Enter password to unlock cashier terminal.</p>

        <div className="mt-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Password</label>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Enter password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold tracking-[0.2em] outline-none focus:border-blue-500"
          />
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={isSubmitting || password.trim().length === 0}
            onClick={submit}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Unlocking..." : "Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TerminalLockModal;
