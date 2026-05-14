import ManagerPageLayout from "../../components/manager/ManagerPageLayout";

export default function ManagerSettingsPage() {
  return (
    <ManagerPageLayout
      activeItem="Settings"
      title="Settings"
      subtitle="Branch preferences, offline behavior, and dashboard configuration can be managed here."
    >
      <section className="rounded-[24px] border border-white/70 bg-white/95 p-6 shadow-[0_18px_42px_rgba(1,24,84,0.14)]">
        <p className="text-sm text-slate-600">
          Settings will be expanded here next. Your branch-aware offline data model is already active.
        </p>
      </section>
    </ManagerPageLayout>
  );
}
