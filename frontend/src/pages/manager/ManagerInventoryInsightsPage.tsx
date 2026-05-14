import ManagerPageLayout from "../../components/manager/ManagerPageLayout";
import AnalyticsErrorBoundary from "../../features/salesAnalytics/components/AnalyticsErrorBoundary";
import InventoryInsightsView from "../../features/salesAnalytics/components/InventoryInsightsView";

export default function ManagerInventoryInsightsPage() {
  return (
    <ManagerPageLayout
      activeItem="Inventory Insights"
      title="Inventory Insights"
      subtitle="Review stock risk, reorder watchlists, and inventory trends for the selected branch."
      showDateFilter
    >
      <AnalyticsErrorBoundary>
        <section
          className="rounded-[24px] border border-white/70 bg-white/95 p-4 sm:p-5 shadow-[0_18px_42px_rgba(1,24,84,0.14)]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(243,248,255,0.97) 100%)",
          }}
        >
          <InventoryInsightsView />
        </section>
      </AnalyticsErrorBoundary>
    </ManagerPageLayout>
  );
}
