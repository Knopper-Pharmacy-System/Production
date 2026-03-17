type AdminFooterProps = {
  lastSync?: Date | null;
  version?: string;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export default function AdminFooter({
  lastSync,
  version = "v1.0.0",
}: AdminFooterProps) {
  return (
    <footer className="mt-2 border-t border-white/12 pb-5 pt-4 text-xs text-white/60">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-white/82">Knopper POS Admin Dashboard</span>
          <span className="hidden text-white/25 sm:inline">|</span>
          <span>© {new Date().getFullYear()}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">
          <span>Version {version}</span>
          {lastSync ? (
            <>
              <span className="hidden text-white/25 sm:inline">|</span>
              <span>Last sync {formatTime(lastSync)}</span>
            </>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
