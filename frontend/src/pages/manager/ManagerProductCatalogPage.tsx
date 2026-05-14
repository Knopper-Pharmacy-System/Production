import ManagerPageLayout from "../../components/manager/ManagerPageLayout";
import AnalyticsErrorBoundary from "../../features/salesAnalytics/components/AnalyticsErrorBoundary";
import ProductCatalogView from "../../features/salesAnalytics/components/ProductCatalogView";

export default function ManagerProductCatalogPage() {
  return (
    <ManagerPageLayout
      activeItem="Product Catalog"
      title="Product Catalog"
      subtitle="Search, filter, and paginate your product list by branch in a dedicated full-page workspace."
      showDateFilter
    >
      <AnalyticsErrorBoundary>
        <section
          className="rounded-[24px] border border-white/70 bg-white/95 p-4 sm:p-5 shadow-[0_18px_42px_rgba(1,24,84,0.14)]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(243,248,255,0.97) 100%)",
          }}
        >
          <ProductCatalogView />
        </section>
      </AnalyticsErrorBoundary>
    </ManagerPageLayout>
  );
}
