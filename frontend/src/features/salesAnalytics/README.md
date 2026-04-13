/**
 * PHARMACY MANAGER DASHBOARD - IMPLEMENTATION GUIDE
 * 
 * This guide explains:
 * 1. Dashboard Architecture
 * 2. How to use the Dashboard component
 * 3. Data flow from Excel files to analytics
 * 4. Date range filtering
 * 5. Customization options
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. DASHBOARD ARCHITECTURE OVERVIEW
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         MANAGER DASHBOARD                               │
 * │                     (ManagerDashboardPage.tsx)                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *                                    ↓
 *          ┌──────────────────────────────────────────────────┐
 *          │  AnalyticsTabs.tsx (Tab Navigation)             │
 *          │  - Overview (DEFAULT)                           │
 *          │  - Trends & Reports                             │
 *          │  - Inventory Insights                           │
 *          │  - Product Catalog                              │
 *          └──────────────────────────────────────────────────┘
 *                                    ↓
 *          ┌──────────────────────────────────────────────────┐
 *          │   OverviewDashboard.tsx (THIS IS THE MAIN VIEW) │
 *          │                                                  │
 *          │   ┌────────────────────────────────────────┐   │
 *          │   │  6 KPI Cards (Top Row)                 │   │
 *          │   │  - Total Gross Sales                   │   │
 *          │   │  - Total Net Profit                    │   │
 *          │   │  - Total Units Sold                    │   │
 *          │   │  - Discount %                          │   │
 *          │   │  - Transaction Count                   │   │
 *          │   │  - Average Transaction Value           │   │
 *          │   └────────────────────────────────────────┘   │
 *          │                                                  │
 *          │   ┌────────────────────────────────────────┐   │
 *          │   │  Daily Sales Trend (Area Chart) - LEFT │   │
 *          │   │  - Blue: Gross Sales                   │   │
 *          │   │  - Green: Net Profit                   │   │
 *          │   └────────────────────────────────────────┘   │
 *          │                                                  │
 *          │   ┌────────────────────────────────────────┐   │
 *          │   │  Quick Insights (Sidebar) - RIGHT      │   │
 *          │   │  - Top Selling Item                    │   │
 *          │   │  - Best Cashier                        │   │
 *          │   │  - Highest Sales Date                  │   │
 *          │   └────────────────────────────────────────┘   │
 *          │                                                  │
 *          │   ┌────────────────────────────────────────┐   │
 *          │   │  Hourly Sales Trend (Bar Chart)        │   │
 *          │   │  - Orange bars for each hour (0-23)    │   │
 *          │   │  - Shows peak sales hours              │   │
 *          │   └────────────────────────────────────────┘   │
 *          │                                                  │
 *          │   ┌────────────────────────────────────────┐   │
 *          │   │  Top 10 Products (Horiz Bar) - LEFT    │   │
 *          │   │  - Sorted by quantity sold             │   │
 *          │   └────────────────────────────────────────┘   │
 *          │                                                  │
 *          │   ┌────────────────────────────────────────┐   │
 *          │   │  Department Breakdown (Donut Chart)    │   │
 *          │   │  - Sales by department                 │   │
 *          │   │  - Different color per department      │   │
 *          │   └────────────────────────────────────────┘   │
 *          └──────────────────────────────────────────────────┘
 *                                    ↓
 *          ┌──────────────────────────────────────────────────┐
 *          │  Zustand Store (useSalesAnalyticsStore.ts)      │
 *          │                                                  │
 *          │  State:                                          │
 *          │  - salesRows: SalesRow[]                        │
 *          │  - fastMovingRows: FastMovingRow[]              │
 *          │  - productRows: ProductCatalogRow[]             │
 *          │  - dateFilter: DateFilterState                  │
 *          │                                                  │
 *          │  Methods:                                        │
 *          │  - getOverviewKpis() → KpiOverview             │
 *          │  - getQuickInsights() → QuickInsights          │
 *          │  - getOverviewCharts() → OverviewCharts        │
 *          │  - getFilteredSalesRows() → SalesRow[]         │
 *          │  - setDatePreset() → Update filter             │
 *          └──────────────────────────────────────────────────┘
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2. HOW TO USE THE DASHBOARD COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * BASIC USAGE
 * ───────────
 * 
 * import OverviewDashboard from "@/features/salesAnalytics/components/OverviewDashboard";
 * 
 * export function MyPage() {
 *   return (
 *     <div className="p-6">
 *       <h1>Sales Dashboard</h1>
 *       <OverviewDashboard />
 *     </div>
 *   );
 * }
 * 
 * That's it! The component automatically:
 * 1. Connects to Zustand store
 * 2. Fetches KPIs, insights, and charts data
 * 3. Applies date filters
 * 4. Renders all cards and charts
 * 5. Handles empty states
 */

/**
 * WITH DATE RANGE FILTER
 * ──────────────────────
 * 
 * import OverviewDashboard from "@/features/salesAnalytics/components/OverviewDashboard";
 * import DateRangeFilter from "@/features/salesAnalytics/components/DateRangeFilter";
 * import { useSalesAnalyticsStore } from "@/features/salesAnalytics/store/useSalesAnalyticsStore";
 * 
 * export function DashboardPage() {
 *   const dateFilterLabel = useSalesAnalyticsStore((state) => state.getDateFilterLabel());
 *   
 *   return (
 *     <div className="p-6 space-y-4">
 *       <h1>Sales Dashboard</h1>
 *       
 *       {// Optional: Show current filter}
 *       <p className="text-sm text-gray-600">{dateFilterLabel}</p>
 *       
 *       {// Optional: Provide date range picker}
 *       <DateRangeFilter />
 *       
 *       {// Main dashboard}
 *       <OverviewDashboard />
 *     </div>
 *   );
 * }
 */

/**
 * PROGRAMMATICALLY CHANGE DATE FILTER
 * ────────────────────────────────────
 * 
 * import { useSalesAnalyticsStore } from "@/features/salesAnalytics/store/useSalesAnalyticsStore";
 * 
 * function MyComponent() {
 *   const setDatePreset = useSalesAnalyticsStore((state) => state.setDatePreset);
 *   const setCustomDateRange = useSalesAnalyticsStore((state) => state.setCustomDateRange);
 *   
 *   // Change to "This Month"
 *   const handleThisMonth = () => {
 *     setDatePreset("this-month");
 *   };
 *   
 *   // Change to custom date range
 *   const handleCustomRange = () => {
 *     setCustomDateRange("2024-01-01", "2024-01-31");
 *   };
 *   
 *   // Show all-time data
 *   const handleAllTime = () => {
 *     setDatePreset("all-time");
 *   };
 *   
 *   return (
 *     <div className="space-x-2">
 *       <button onClick={handleThisMonth}>This Month</button>
 *       <button onClick={handleCustomRange}>Jan 1-31, 2024</button>
 *       <button onClick={handleAllTime}>All Time</button>
 *     </div>
 *   );
 * }
 */

/**
 * ACCESS INDIVIDUAL KPIs
 * ──────────────────────
 * 
 * import { useSalesAnalyticsStore } from "@/features/salesAnalytics/store/useSalesAnalyticsStore";
 * 
 * function SalesCard() {
 *   const kpis = useSalesAnalyticsStore((state) => state.getOverviewKpis());
 *   
 *   return (
 *     <div>
 *       <h3>Today's Sales</h3>
 *       <p>Gross: ₱{kpis.totalGrossSales.toLocaleString()}</p>
 *       <p>Profit: ₱{kpis.totalNetProfit.toLocaleString()}</p>
 *       <p>Transactions: {kpis.transactionCount}</p>
 *     </div>
 *   );
 * }
 */

/**
 * ACCESS CHARTS DATA
 * ──────────────────
 * 
 * import { useSalesAnalyticsStore } from "@/features/salesAnalytics/store/useSalesAnalyticsStore";
 * 
 * function CustomChart() {
 *   const charts = useSalesAnalyticsStore((state) => state.getOverviewCharts());
 *   
 *   // salesTrend: SalesTrendPoint[] (date, grossSales, netProfit, units)
 *   console.log(charts.salesTrend);
 *   
 *   // hourlyTrend: HourlyTrendPoint[] (hour, grossSales, transactionCount)
 *   console.log(charts.hourlyTrend);
 *   
 *   // topProducts: TopProductPoint[] (item, qtySold)
 *   console.log(charts.topProducts);
 *   
 *   // departmentBreakdown: DepartmentBreakdownPoint[] (department, value)
 *   console.log(charts.departmentBreakdown);
 *   
 *   // Use with your own charting library
 *   return <MyCustomChart data={charts.salesTrend} />;
 * }
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 3. DATA FLOW: EXCEL FILES → STORE → DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * STEP 1: USER UPLOADS EXCEL FILES
 * ──────────────────────────────────
 * 
 * Via SmartReportUploader component:
 * 
 *   Manager selects 3 Excel files:
 *   ├── Sales_Transaction_Report.xlsx
 *   ├── Fast_Moving_Items_Report.xlsx
 *   └── Product_Master_Catalog.xlsx
 * 
 * Files are uploaded via ingestFiles() method in Zustand store
 */

/**
 * STEP 2: FILE PARSING (reportParsers.ts)
 * ────────────────────────────────────────
 * 
 * Each file goes through parseExcelReport():
 * 
 * A. SALES TRANSACTION REPORT
 *    ├── Read as XLSX.WorkBook
 *    ├── Auto-detect sheet with headers matching:
 *    │   "DATE", "TIME", "CASHIER", "TRX NO", "ITEM CODE",
 *    │   "QTY SOLD", "GROSS SALES", "NET PROFIT", "DISCOUNT"
 *    │
 *    ├── Extract raw rows (skip headers)
 *    │
 *    ├── CLEAN each row:
 *    │   ✗ Remove if: TRX NO = "TOTAL" or empty
 *    │   ✗ Remove if: Item Code is empty
 *    │   ✗ Remove if: Qty Sold ≤ 0
 *    │   ✗ Remove if: Cashier is "NaN" or empty
 *    │   ✓ FORWARD-FILL missing dates from previous row
 *    │   ✓ Calculate Net Profit if missing (Gross - Cost - Discount)
 *    │
 *    └── Result: SalesRow[] with ~892 valid rows
 * 
 * B. FAST MOVING REPORT
 *    ├── Auto-detect sheet with headers:
 *    │   "ITEM CODE", "QTY SOLD", "GROSS SALES", "DEPARTMENT"
 *    │
 *    ├── Extract raw rows
 *    │
 *    ├── CLEAN each row:
 *    │   ✗ Remove if: Description AND Item Code both empty
 *    │   ✗ Remove if: Qty Sold ≤ 0 AND Gross Sales ≤ 0
 *    │
 *    └── Result: FastMovingRow[] with ~78 valid rows
 * 
 * C. PRODUCT CATALOG REPORT
 *    ├── Auto-detect sheet with headers:
 *    │   "ITEM CODE", "DESCRIPTION", "DEPARTMENT", "PRICE", "COST"
 *    │
 *    ├── Extract raw rows
 *    │
 *    ├── CLEAN each row:
 *    │   ✗ Remove if: Description is empty
 *    │   ✗ Remove if: Item Code AND Barcode both empty
 *    │
 *    └── Result: ProductCatalogRow[] with ~320 valid rows
 */

/**
 * STEP 3: STORE DATA IN ZUSTAND
 * ──────────────────────────────
 * 
 * After successful parsing:
 * 
 *   useSalesAnalyticsStore.setState({
 *     salesRows: [...892 rows from Sales Report...],
 *     fastMovingRows: [...78 rows from Fast Moving...],
 *     productRows: [...320 rows from Product Catalog...],
 *     dateFilter: { preset: "all-time", fromDate: "", toDate: "" }
 *   })
 * 
 * Data is persisted in localStorage (via Zustand persist middleware)
 * So dashboard data survives page refreshes
 */

/**
 * STEP 4: APPLY DATE FILTERS
 * ───────────────────────────
 * 
 * getFilteredSalesRows() method:
 * 
 *   const filteredRows = salesRows.filter(row => {
 *     if (dateFilter.fromDate && row.date < dateFilter.fromDate) return false;
 *     if (dateFilter.toDate && row.date > dateFilter.toDate) return false;
 *     return true;
 *   });
 * 
 * Example:
 *   All data: 892 rows
 *   Filter: "this-month" (Jan 1-31, 2024) → 532 rows
 *   Filter: "today" (Jan 15, 2024) → 45 rows
 * 
 * Each calculation uses getFilteredSalesRows() automatically
 */

/**
 * STEP 5: CALCULATE KPIs
 * ──────────────────────
 * 
 * getOverviewKpis() runs these calculations on filtered rows:
 * 
 *   totalGrossSales = SUM(grossSales from all filtered rows)
 *   totalNetProfit = SUM(netProfit from all filtered rows)
 *   totalUnitsSold = SUM(qtySold from all filtered rows)
 *   discountPercent = (SUM(discountAmount) / totalGrossSales) × 100
 *   transactionCount = COUNT(UNIQUE transactionNo)
 *   averageTransactionValue = totalGrossSales / transactionCount
 * 
 * Returns: KpiOverview
 *   {
 *     totalGrossSales: 125450,
 *     totalNetProfit: 42150,
 *     totalUnitsSold: 8234,
 *     discountPercent: 2.3,
 *     transactionCount: 483,
 *     averageTransactionValue: 259.94
 *   }
 */

/**
 * STEP 6: RENDER DASHBOARD
 * ────────────────────────
 * 
 * OverviewDashboard.tsx:
 * 
 *   1. Fetch data from store:
 *      const kpis = useSalesAnalyticsStore((state) => state.getOverviewKpis());
 *      const insights = useSalesAnalyticsStore((state) => state.getQuickInsights());
 *      const charts = useSalesAnalyticsStore((state) => state.getOverviewCharts());
 * 
 *   2. Validate data:
 *      - Handle null/undefined values
 *      - Check for empty data (show "No data" message)
 * 
 *   3. Format for display:
 *      - Currency: money(125450) → "PHP 125,450.00"
 *      - Numbers: number(8234) → "8,234.00"
 *      - Percentages: 2.3 + "%" → "2.30%"
 * 
 *   4. Render components:
 *      - 6 KPI Cards
 *      - Daily Sales Trend Area Chart
 *      - Quick Insights Sidebar
 *      - Hourly Sales Trend Bar Chart
 *      - Top 10 Products Horizontal Bar Chart
 *      - Department Breakdown Donut Chart
 * 
 * All components are responsive and use Tailwind CSS with nice gradients
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 4. HANDLING DATA FROM THE 3 EXCEL FILES
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * FILE 1: SALES TRANSACTION REPORT
 * ─────────────────────────────────
 * 
 * Purpose: Granular daily transaction-level sales data
 * 
 * Expected structure:
 * ┌─────┬──────┬────────┬────────┬───────────┬────────┬────────────┬──────────┐
 * │DATE │ TIME │CASHIER │TRX NO. │ITEM CODE  │QTY SOLD│GROSS SALES │NET PROFIT│
 * ├─────┼──────┼────────┼────────┼───────────┼────────┼────────────┼──────────┤
 * │1/15 │ 9:30 │ Maria  │001     │ PARA500   │   2    │    250     │    100   │
 * │     │      │        │        │ IBUP400   │   1    │    180     │     55   │
 * │1/15 │10:15 │ John   │002     │ VITE500   │   5    │    500     │    200   │
 * │1/16 │ 9:00 │ Maria  │003     │ PARA500   │   3    │    375     │    150   │
 * │...  │ ...  │  ...   │ ...    │  ...      │  ...   │    ...     │   ...    │
 * │1/31 │23:45 │ Sarah  │TOTAL   │ ----      │ 8234   │  125450    │  42150   │  ← THIS ROW IS IGNORED
 * └─────┴──────┴────────┴────────┴───────────┴────────┴────────────┴──────────┘
 * 
 * Important notes:
 * 
 * ✗ ROWS TO SKIP:
 *   - TRX NO. = "TOTAL" or empty
 *   - Missing ITEM CODE
 *   - QTY SOLD ≤ 0
 *   - Missing CASHIER
 *   - Malformed dates/numbers
 * 
 * ✓ DATA TRANSFORMATIONS:
 *   - DATE: Parse as "1/15" → Store as "2024-01-15" (ISO format)
 *   - TIME: "9:30" → Store as hour=9 (integer 0-23)
 *   - CASHIER: Trim whitespace, remove "NaN"
 *   - TRX NO.: Trim, normalize case
 *   - ITEM CODE: Normalize (uppercase, remove ".0" suffix)
 *   - DISCOUNT: If provided, use it; else calculate
 *   - NET PROFIT: If provided, use it; else use GROSS SALES - COST - DISCOUNT
 *   - DESCRIPTION: Standardize from "Description", "Item Name", etc. columns
 * 
 * ✓ FORWARD-FILL:
 *   - If a transaction has multiple items but DATE only on first row,
 *     the DATE is copied to subsequent items in same transaction
 * 
 * Use for: All KPIs, charts, and quick insights
 * Volume: Usually 800-2000 rows per month per branch
 */

/**
 * FILE 2: FAST MOVING ITEMS REPORT
 * ─────────────────────────────────
 * 
 * Purpose: Summary of fast-moving products during a period (e.g., weekly)
 * 
 * Expected structure:
 * ┌───────────┬──────────────────────┬──────────┬────────────┬────────────┐
 * │ITEM CODE  │ DESCRIPTION          │QTY SOLD  │GROSS SALES │DEPARTMENT │
 * ├───────────┼──────────────────────┼──────────┼────────────┼────────────┤
 * │PARA500    │Paracetamol 500mg     │   234    │    5850    │Pain Relief │
 * │IBUP400    │Ibuprofen 400mg       │   189    │    7560    │Pain Relief │
 * │VITE500    │Vitamin C 500mg       │   156    │    3120    │Vitamins   │
 * │OMEPRAZOL  │Omeprazole 20mg       │   142    │    8520    │Digestives │
 * │...        │...                   │   ...    │    ...     │    ...     │
 * └───────────┴──────────────────────┴──────────┴────────────┴────────────┘
 * 
 * Important notes:
 * 
 * ✗ ROWS TO SKIP:
 *   - Missing DESCRIPTION and ITEM CODE
 *   - Both QTY SOLD ≤ 0 AND GROSS SALES ≤ 0
 * 
 * ✓ MERGE WITH SALES DATA:
 *   - Used to VALIDATE and ENRICH sales data
 *   - Item codes matched with Sales Report rows
 *   - If item in Sales but not in Fast Moving, no problem (still included)
 *   - If item in Fast Moving but not in Sales, it's informational only
 * 
 * Use for: Product rankings, validation, optional enrichment
 * Volume: Usually 50-200 rows (top movers only)
 * Note: This report is OPTIONAL for basic overview (main source is Sales Report)
 */

/**
 * FILE 3: PRODUCT MASTER CATALOG
 * ──────────────────────────────
 * 
 * Purpose: Complete product database with departments, pricing, costs
 * 
 * Expected structure:
 * ┌───────────┬──────────────────────┬────────────┬─────────┬────────┐
 * │ITEM CODE  │ DESCRIPTION          │DEPARTMENT  │PRICE    │COST    │
 * ├───────────┼──────────────────────┼────────────┼─────────┼────────┤
 * │PARA500    │Paracetamol 500mg     │Pain Relief │   25    │   10   │
 * │IBUP400    │Ibuprofen 400mg       │Pain Relief │   40    │   18   │
 * │VITE500    │Vitamin C 500mg       │Vitamins    │   20    │    8   │
 * │OMEPRAZOL  │Omeprazole 20mg       │Digestives  │   60    │   28   │
 * │COUGHSYRUP │Cough Syrup (200ml)   │Cough/Cold  │   85    │   35   │
 * │...        │...                   │   ...      │  ...    │  ...   │
 * └───────────┴──────────────────────┴────────────┴─────────┴────────┘
 * 
 * Important notes:
 * 
 * ✗ ROWS TO SKIP:
 *   - Missing DESCRIPTION
 *   - Missing both ITEM CODE and BARCODE
 * 
 * ✓ USED FOR:
 *   - DEPARTMENT LOOKUP when processing Sales Report
 *     → Sales row ITEM CODE "PARA500" → Find department "Pain Relief"
 *     → Used in Department Breakdown chart
 * 
 * ✓ MATCHING STRATEGY (in getOverviewCharts):
 *   
 *   // Build lookup map from Product Catalog
 *   const productByCode = new Map();
 *   productRows.forEach((product) => {
 *     const normalized = product.itemCode.toUpperCase().replace(/\.0$/, "");
 *     productByCode.set(normalized, product);
 *   });
 *   
 *   // For each sale, lookup department
 *   salesRows.forEach((sale) => {
 *     const normalized = sale.itemCode.toUpperCase().replace(/\.0$/, "");
 *     const product = productByCode.get(normalized);
 *     const department = product?.department || "Uncategorized";
 *     // Add to department breakdown...
 *   });
 *   
 *   // Result: Sales categorized by department
 * 
 * ✓ NORMALIZATION:
 *   - Item codes are normalized before matching:
 *     PARA500, para500, 12345.0 → all match to same product
 *   - Allows flexibility in how items are coded across reports
 * 
 * Use for: Department breakdown, product details, categorization
 * Volume: Usually 300-500 rows (all products in inventory)
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 5. CUSTOMIZATION & EXTENSION
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ADD A NEW KPI CARD
 * ──────────────────
 * 
 * 1. Add to types.ts KpiOverview:
 * 
 *    export type KpiOverview = {
 *      totalGrossSales: number;
 *      // ... existing fields ...
 *      totalRefunds: number; // NEW
 *    };
 * 
 * 2. Calculate in store getOverviewKpis():
 * 
 *    totalRefunds: salesRows
 *      .filter(row => row.grossSales < 0)
 *      .reduce((sum, row) => sum + Math.abs(row.grossSales), 0),
 * 
 * 3. Render in OverviewDashboard.tsx:
 * 
 *    <KpiCard
 *      label="Total Refunds"
 *      value={money(safeKpis.totalRefunds)}
 *      helper="Total value of returned items"
 *      accent="red"
 *    />
 */

/**
 * ADD A NEW CHART
 * ───────────────
 * 
 * 1. Add type to OverviewCharts:
 * 
 *    export type OverviewCharts = {
 *      // ... existing ...
 *      cashierComparison: CashierComparisonPoint[];
 *    };
 * 
 * 2. Calculate in store getOverviewCharts():
 * 
 *    const cashierMap = new Map<string, { sales: number; count: number }>();
 *    salesRows.forEach((row) => {
 *      const current = cashierMap.get(row.cashier) ?? { sales: 0, count: 0 };
 *      current.sales += row.grossSales;
 *      current.count += 1;
 *      cashierMap.set(row.cashier, current);
 *    });
 * 
 *    cashierComparison: Array.from(cashierMap.entries())
 *      .map(([cashier, data]) => ({
 *        cashier,
 *        sales: data.sales,
 *        avgPerTx: data.sales / data.count
 *      }))
 *      .sort((a, b) => b.sales - a.sales)
 * 
 * 3. Render in OverviewDashboard.tsx:
 * 
 *    <BarChart data={charts.cashierComparison}>
 *      <Bar dataKey="sales" fill="#60a5fa" />
 *    </BarChart>
 */

/**
 * FILTER BY CASHIER
 * ─────────────────
 * 
 * 1. Add to store state:
 * 
 *    selectedCashier: string = "";
 * 
 * 2. Add getter for filtered rows:
 * 
 *    getFilteredSalesRowsByCashier: () => {
 *      let rows = get().getFilteredSalesRows();
 *      const { selectedCashier } = get();
 *      if (!selectedCashier) return rows;
 *      return rows.filter(row => row.cashier === selectedCashier);
 *    }
 * 
 * 3. Use in calculations:
 * 
 *    // Instead of getFilteredSalesRows()
 *    const salesRows = get().getFilteredSalesRowsByCashier();
 * 
 * All KPIs and charts will now be filtered by cashier!
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 6. TROUBLESHOOTING
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * "No data yet" on overview
 * ──────────────────────────
 * Causes:
 * 1. Files not uploaded yet → Show uploader
 * 2. All rows filtered out by data cleaning → Check reportParsers.ts logic
 * 3. Date filter too restrictive → Reset to "all-time"
 * 
 * Check:
 *   const store = useSalesAnalyticsStore((state) => state);
 *   console.log("salesRows:", store.salesRows.length);
 *   console.log("filtered:", store.getFilteredSalesRows().length);
 */

/**
 * Negative numbers in calculations
 * ──────────────────────────────────
 * Causes:
 * 1. Refund transactions (negative gross sales)
 * 2. Math error in cost calculation
 * 
 * Solution:
 *   // Filter out negative sales before calculations
 *   const validRows = salesRows.filter(row => row.grossSales > 0);
 */

/**
 * Department shows as "Uncategorized"
 * ────────────────────────────────────
 * Causes:
 * 1. Item code not found in Product Catalog
 * 2. Item code mismatch (normalization issue)
 * 
 * Solution:
 *   // Check item code normalization
 *   const normalized = itemCode.toUpperCase().replace(/\.0+$/, "");
 *   // Ensure product catalog has matching codes
 */

/**
 * Date forward-fill not working
 * ──────────────────────────────
 * Causes:
 * 1. First row of file has empty date (no reference to forward-fill from)
 * 
 * Solution:
 *   // In reportParsers.ts, handle first-row-no-date case:
 *   if (!date && !lastKnownDate) return; // Skip row
 *   const actualDate = date || lastKnownDate;
 */

/**
 * Hour values incorrect
 * ─────────────────────
 * Causes:
 * 1. Excel stores time as decimal (0.4 = 9:36 AM in Excel time)
 * 2. Time column contains full timestamps instead of hours
 * 
 * Solution:
 *   // extractHour() function handles both:
 *   if (typeof value === "number" && value < 1) {
 *     return Math.floor(value * 24); // Excel decimal format
 *   }
 */

export {};
