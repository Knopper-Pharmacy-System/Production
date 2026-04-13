import AdminFooter from "../../components/admin/AdminFooter";
import ManagerPageLayout from "../../components/manager/ManagerPageLayout";
import OverviewDashboard from "../../features/salesAnalytics/components/OverviewDashboard";
import DateRangeFilter from "../../features/salesAnalytics/components/DateRangeFilter";
import { useSalesAnalyticsStore } from "../../features/salesAnalytics/store/useSalesAnalyticsStore";

export default function ManagerDashboardPage() {
  const hasData = useSalesAnalyticsStore((state) => state.salesRows.length > 0);
  const dateFilterLabel = useSalesAnalyticsStore((state) => state.getDateFilterLabel());

  return (
    <ManagerPageLayout
      activeItem="Dashboard"
      title="Manager Sales Intelligence"
      subtitle="Overview KPIs and charts for the currently selected branch."
      showDateFilter={false}
    >
      {hasData && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">{dateFilterLabel}</p>
          <DateRangeFilter />
        </div>
      )}

      {!hasData && (
        <section
          className="rounded-2xl p-6"
          style={{
            background: "linear-gradient(180deg, #ecfdf5 0%, #dff9ef 100%)",
            border: "1px solid rgba(110, 231, 183, 0.72)",
            color: "#065f46",
          }}
        >
          <h3 className="font-semibold mb-2">Welcome to Manager Dashboard</h3>
          <p>Upload sales reports from the admin panel to see analytics and insights.</p>
        </section>
      )}

      <OverviewDashboard />

      <AdminFooter />
    </ManagerPageLayout>
  );
}
