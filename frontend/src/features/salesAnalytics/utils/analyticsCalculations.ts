/**
 * PHARMACY MANAGER DASHBOARD - ANALYTICS CALCULATIONS
 * 
 * This file documents how analytics are calculated from the 3 Excel reports.
 * All formulas and data transformations are explained here for reference.
 * 
 * The actual calculation logic is implemented in useSalesAnalyticsStore.ts
 */

import type { SalesRow, ProductCatalogRow } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. DATA INGESTION & CLEANING
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * When Excel files are uploaded, they go through parseExcelReport() in reportParsers.ts
 * 
 * SALES TRANSACTION REPORT Processing:
 * ────────────────────────────────────
 * Expected columns:
 *   - DATE (or "Sales Date", "Transaction Date") → Parsed to ISO format (YYYY-MM-DD)
 *   - TIME (or "Hour", "Transaction Time") → Extracted to 0-23 hour value
 *   - CASHIER (or "Cashier Name", "User", "Served By")
 *   - TRX NO. (or "Transaction", "Invoice No.") → Transaction identifier
 *   - ITEM CODE (or "SKU", "Product Code")
 *   - QTY SOLD (or "Quantity", "Units", "Pieces")
 *   - GROSS SALES (or "Amount", "Sales", "Total Sales")
 *   - GROSS COST (or "Cost", "Total Cost") → Used if NET PROFIT not provided
 *   - DISCOUNT AMT (or "Discount Amount", "Discount")
 *   - NET PROFIT (or "Profit", "Gross Profit") → Calculated if not present
 *   - DESCRIPTION (or "Item Description", "Product", "Item Name")
 * 
 * Data Cleaning Rules:
 * ✓ Rows where TRX NO. is "TOTAL" or empty are FILTERED OUT
 * ✓ Empty rows (all fields) are FILTERED OUT
 * ✓ Rows without Item Code, Quantity, or Gross Sales are FILTERED OUT
 * ✓ Rows where Cashier is missing are FILTERED OUT
 * ✓ Missing DATA is FORWARD-FILLED from previous rows in the same group
 * ✓ If NET PROFIT not provided: NET PROFIT = GROSS SALES - GROSS COST - DISCOUNT
 * 
 * FAST MOVING REPORT Processing:
 * ──────────────────────────────
 * Expected columns:
 *   - ITEM CODE → Matched with Sales report via ITEM CODE
 *   - DESCRIPTION
 *   - QTY SOLD → Total units sold in the reporting period
 *   - GROSS SALES → Total gross sales
 *   - DEPARTMENT (or "Dept", "Classification") → For department breakdown
 *   - SUB-CATEGORY (or "Category", "Subcategory")
 * 
 * Data Cleaning Rules:
 * ✓ Row must have Description OR Item Code
 * ✓ Row must have either Qty Sold > 0 OR Gross Sales > 0
 * ✓ Rows that don't meet these are FILTERED OUT
 * 
 * PRODUCT CATALOG REPORT Processing:
 * ──────────────────────────────────
 * Expected columns:
 *   - ITEM CODE → Lookup key
 *   - BARCODE
 *   - DESCRIPTION
 *   - DEPARTMENT
 *   - CATEGORY
 *   - SRP (or "Price", "Selling Price", "Regular Price")
 *   - COST (or "Unit Cost", "UnitCost")
 *   - REORDER POINT (or "Min Stock")
 *   - STOCK (or "Qty on Hand", "Current Stock")
 * 
 * Data Cleaning Rules:
 * ✓ Row must have Description AND (Item Code OR Barcode)
 * ✓ Used primarily for DEPARTMENT LOOKUP and product details
 * ✓ Merged with Sales data using Item Code as key
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2. KPI CALCULATIONS (Top 6 Cards)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const kpiCalculations = {
  /**
   * TOTAL GROSS SALES
   * ─────────────────
   * Formula: Σ(Gross Sales from all sales rows)
   * 
   * Example:
   *   Row 1: Gross Sales = 500
   *   Row 2: Gross Sales = 300
   *   Row 3: Gross Sales = 200
   * ─────────────────────
   *   Total = 1,000
   * 
   * Currency: PHP (Philippine Peso)
   * Filtered by: Date range (All Time, This Month, etc.)
   */
  calculateTotalGrossSales: (salesRows: SalesRow[]): number => {
    return salesRows.reduce((sum, row) => sum + row.grossSales, 0);
  },

  /**
   * TOTAL NET PROFIT
   * ────────────────
   * Formula: Σ(Net Profit from all sales rows)
   * 
   * Where Net Profit = Gross Sales - Gross Cost - Discount Amount
   * 
   * This is either provided in the Excel file or calculated during parsing.
   * Shows the actual profit margin after all deductions.
   */
  calculateTotalNetProfit: (salesRows: SalesRow[]): number => {
    return salesRows.reduce((sum, row) => sum + row.netProfit, 0);
  },

  /**
   * TOTAL UNITS SOLD
   * ────────────────
   * Formula: Σ(Qty Sold from all sales rows)
   * 
   * Represents the total NUMBER OF ITEMS sold (not quantity of transactions)
   * Example: If 5 units of item A and 3 units of item B sold → Total = 8 units
   */
  calculateTotalUnitsSold: (salesRows: SalesRow[]): number => {
    return salesRows.reduce((sum, row) => sum + row.qtySold, 0);
  },

  /**
   * DISCOUNT AMOUNT + DISCOUNT RATE (%)
   * ────────────────────────────────────
   * Total Discount Amount: Σ(Discount Amount from all rows)
   * Discount Rate %: (Total Discount / Total Gross Sales) × 100
   * 
   * Example:
   *   Total Gross Sales = 1,000
   *   Total Discounts = 50
   * ────────────────────────
   *   Discount Rate = (50 / 1000) × 100 = 5%
   * 
   * Shows how much revenue was given as discounts
   */
  calculateDiscountMetrics: (
    salesRows: SalesRow[]
  ): { totalDiscount: number; discountPercent: number } => {
    const totalGross = salesRows.reduce((sum, row) => sum + row.grossSales, 0);
    const totalDiscount = salesRows.reduce((sum, row) => sum + row.discountAmount, 0);
    const discountPercent = totalGross > 0 ? (totalDiscount / totalGross) * 100 : 0;

    return { totalDiscount, discountPercent };
  },

  /**
   * NUMBER OF TRANSACTIONS
   * ──────────────────────
   * Formula: COUNT(UNIQUE Transaction Numbers)
   * 
   * Takes TRX NO. field from Sales Report.
   * Counts UNIQUE transaction numbers (deduplicates).
   * 
   * Important: If a transaction has multiple line items, it's still counted once!
   * Example:
   *   Transaction 001: Item A (qty 2) + Item B (qty 1) = 3 rows
   *   Transaction 002: Item C (qty 5) = 1 row
   * ────────────────────────────────────────────────────
   *   Total Transactions = 2 (not 4 rows)
   */
  calculateTransactionCount: (salesRows: SalesRow[]): number => {
    return new Set(
      salesRows
        .map((row) => row.transactionNo.trim())
        .filter((transactionNo) => transactionNo.length > 0)
    ).size;
  },

  /**
   * AVERAGE TRANSACTION VALUE (ATV)
   * ────────────────────────────────
   * Formula: Total Gross Sales / Number of Transactions
   * 
   * Example:
   *   Total Gross Sales = 1,000
   *   Number of Transactions = 10
   * ────────────────────────────────
   *   ATV = 1,000 / 10 = 100 per transaction
   * 
   * Shows the average amount per checkout/transaction
   * Useful for understanding customer spending patterns
   */
  calculateAverageTransactionValue: (salesRows: SalesRow[]): number => {
    const totalGross = salesRows.reduce((sum, row) => sum + row.grossSales, 0);
    const txCount = kpiCalculations.calculateTransactionCount(salesRows);
    return txCount > 0 ? totalGross / txCount : 0;
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 3. CHART DATA CALCULATIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const chartCalculations = {
  /**
   * SALES TREND BY DATE (Area Chart)
   * ────────────────────────────────
   * Groups sales data by DATE
   * For each date, calculates:
   *   - Gross Sales: Σ(All sales for that date)
   *   - Net Profit: Σ(All profits for that date)
   *   - Units: Σ(All units sold for that date)
   * 
   * Example output:
   *   [
   *     { date: "2024-01-01", grossSales: 2500, netProfit: 500, units: 45 },
   *     { date: "2024-01-02", grossSales: 3000, netProfit: 600, units: 52 },
   *     ...
   *   ]
   * 
   * Sorted by date (chronological order)
   * Blue line for Gross Sales, Green line for Net Profit
   */
  calculateSalesTrendByDate: (salesRows: SalesRow[]) => {
    const trendByDate = new Map<string, { grossSales: number; netProfit: number; units: number }>();

    salesRows.forEach((row) => {
      const current = trendByDate.get(row.date) ?? { grossSales: 0, netProfit: 0, units: 0 };
      current.grossSales += row.grossSales;
      current.netProfit += row.netProfit;
      current.units += row.qtySold;
      trendByDate.set(row.date, current);
    });

    return Array.from(trendByDate.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  },

  /**
   * HOURLY GROSS SALES TREND (Bar Chart)
   * ─────────────────────────────────────
   * Groups sales data by HOUR OF DAY (0-23)
   * For each hour, calculates:
   *   - Gross Sales: Σ(All sales in that hour)
   *   - Transaction Count: COUNT(UNIQUE transactions in that hour)
   * 
   * Example output:
   *   [
   *     { hour: 0, grossSales: 0, transactionCount: 0 },      // Midnight - no sales
   *     { hour: 1, grossSales: 0, transactionCount: 0 },
   *     ...
   *     { hour: 9, grossSales: 5000, transactionCount: 18 },  // Morning peak
   *     { hour: 10, grossSales: 5200, transactionCount: 20 },
   *     ...
   *     { hour: 23, grossSales: 100, transactionCount: 1 },   // Late night
   *   ]
   * 
   * All 24 hours are included (even hours with zero sales for gaps)
   * Formatted as "09:00", "10:00", etc. on the x-axis
   * Orange bars in the chart
   */
  calculateHourlyTrend: (salesRows: SalesRow[]) => {
    const hourlyTrend = new Map<number, { grossSales: number; transactionCount: number }>();
    const txByHour = new Map<number, Set<string>>();

    // Initialize all 24 hours with zero values
    for (let h = 0; h < 24; h++) {
      hourlyTrend.set(h, { grossSales: 0, transactionCount: 0 });
      txByHour.set(h, new Set<string>());
    }

    // Aggregate sales by hour
    salesRows.forEach((row) => {
      const hour = Math.min(23, Math.max(0, row.hour));
      const current = hourlyTrend.get(hour) ?? { grossSales: 0, transactionCount: 0 };
      current.grossSales += row.grossSales;

      const txSet = txByHour.get(hour) ?? new Set<string>();
      if (row.transactionNo) {
        txSet.add(row.transactionNo);
      }
      txByHour.set(hour, txSet);
      hourlyTrend.set(hour, current);
    });

    return Array.from(hourlyTrend.entries())
      .map(([hour, value]) => ({
        hour,
        grossSales: value.grossSales,
        transactionCount: txByHour.get(hour)?.size ?? 0,
      }))
      .sort((a, b) => a.hour - b.hour);
  },

  /**
   * TOP 10 PRODUCTS BY QUANTITY (Horizontal Bar Chart)
   * ────────────────────────────────────────────────
   * Sums up qty sold for each product across all transactions
   * Merges data from:
   *   1. Sales Transaction Report (item code, qty sold, description)
   *   2. Fast Moving Report (item code, qty sold) - optional
   * 
   * Ranks by quantity and shows top 10
   * 
   * Example output:
   *   [
   *     { item: "Paracetamol 500mg", qtySold: 234 },
   *     { item: "Omeprazole 20mg", qtySold: 189 },
   *     { item: "Vitamin C 500mg", qtySold: 156 },
   *     ...
   *   ]
   * 
   * Used to identify best-selling products
   */
  calculateTopProductsByQuantity: (salesRows: SalesRow[], limit: number = 10) => {
    const topProductsByQty = new Map<string, number>();

    salesRows.forEach((row) => {
      const label = row.description || row.itemCode || "Unknown item";
      topProductsByQty.set(label, (topProductsByQty.get(label) ?? 0) + row.qtySold);
    });

    return Array.from(topProductsByQty.entries())
      .map(([item, qtySold]) => ({ item, qtySold }))
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, limit);
  },

  /**
   * DEPARTMENT BREAKDOWN (Pie/Donut Chart)
   * ──────────────────────────────────────
   * Groups sales by DEPARTMENT using Product Catalog lookup
   * 
   * Process:
   *   1. For each ITEM CODE in sales, look up DEPARTMENT from Product Catalog
   *   2. Sum up gross sales by department
   *   3. Rank by value (largest to smallest)
   * 
   * Example output:
   *   [
   *     { department: "Vitamins & Supplements", value: 15000 },
   *     { department: "Pain Relief", value: 12000 },
   *     { department: "Digestives", value: 8500 },
   *     { department: "Uncategorized", value: 1200 },  // Items not found in catalog
   *     ...
   *   ]
   * 
   * Shows sales distribution across pharmacy departments
   * Different colors for each department
   * Only departments with > 0 sales are shown
   */
  calculateDepartmentBreakdown: (
    salesRows: SalesRow[],
    productRows: ProductCatalogRow[]
  ) => {
    // Build quick lookup map for products by item code
    const productByCode = new Map<string, ProductCatalogRow>();
    productRows.forEach((row) => {
      if (row.itemCode) {
        const normalized = row.itemCode.trim().toUpperCase().replace(/\.0+$/, "");
        productByCode.set(normalized, row);
      }
    });

    // Group sales by department
    const departmentMap = new Map<string, number>();
    salesRows.forEach((row) => {
      const normalized = row.itemCode.trim().toUpperCase().replace(/\.0+$/, "");
      const product = productByCode.get(normalized);
      const department = product?.department || "Uncategorized";
      departmentMap.set(department, (departmentMap.get(department) ?? 0) + row.grossSales);
    });

    return Array.from(departmentMap.entries())
      .map(([department, value]) => ({ department, value }))
      .sort((a, b) => b.value - a.value)
      .filter((point) => point.value >= 0);
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 4. QUICK INSIGHTS CALCULATIONS (Right Sidebar)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const insightCalculations = {
  /**
   * TOP SELLING ITEM
   * ────────────────
   * Formula: Product with MAX(quantity sold)
   * 
   * Groups all sales by item description/code
   * Sums quantities for each item
   * Returns the item with highest total quantity
   * 
   * Example:
   *   Paracetamol: 50 + 30 + 40 = 120 units
   *   Ibuprofen: 25 + 15 + 20 = 60 units
   *   Cough Syrup: 10 + 5 + 8 = 23 units
   * ─────────────────────────────────────
   *   Top Selling Item = "Paracetamol" (120 units)
   */
  calculateTopSellingItem: (salesRows: SalesRow[]): string => {
    if (!salesRows.length) return "No data yet";

    const byItem = new Map<string, number>();
    salesRows.forEach((row) => {
      const itemKey = row.description || row.itemCode || "Unknown item";
      byItem.set(itemKey, (byItem.get(itemKey) ?? 0) + row.qtySold);
    });

    return Array.from(byItem.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No data yet";
  },

  /**
   * BEST PERFORMING CASHIER
   * ───────────────────────
   * Formula: Cashier with MAX(gross sales)
   * 
   * Groups sales by cashier name
   * Sums gross sales for each cashier
   * Returns cashier with highest total sales
   * 
   * Example:
   *   Maria: 5000 + 3500 + 4200 = 12,700
   *   John: 3000 + 2500 + 2800 = 8,300
   *   Sarah: 2500 + 1800 + 2200 = 6,500
   * ────────────────────────────────────
   *   Best Cashier = "Maria" (₱12,700)
   * 
   * Can show sales, transactions, or profit
   * Currently uses Gross Sales for ranking
   */
  calculateBestCashier: (salesRows: SalesRow[]): string => {
    if (!salesRows.length) return "No data yet";

    const byCashier = new Map<string, number>();
    salesRows.forEach((row) => {
      const cashierKey = row.cashier || "Unknown cashier";
      byCashier.set(cashierKey, (byCashier.get(cashierKey) ?? 0) + row.grossSales);
    });

    return Array.from(byCashier.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No data yet";
  },

  /**
   * HIGHEST SALES DATE
   * ──────────────────
   * Formula: Date with MAX(gross sales)
   * 
   * Groups sales by date
   * Sums gross sales for each date
   * Returns the date with highest total sales
   * 
   * Example:
   *   2024-01-15: ₱8,500
   *   2024-01-16: ₱12,300 ← Highest
   *   2024-01-17: ₱9,800
   * ─────────────────────────
   *   Highest Sales Date = "2024-01-16"
   * 
   * Shows peak sales day in the date range
   */
  calculateHighestSalesDate: (salesRows: SalesRow[]): string => {
    if (!salesRows.length) return "No data yet";

    const byDate = new Map<string, number>();
    salesRows.forEach((row) => {
      const dateKey = row.date || "Unknown date";
      byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + row.grossSales);
    });

    return Array.from(byDate.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No data yet";
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 5. DATA FILTERING BY DATE RANGE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * All KPIs, insights, and charts respect the selected date range filter.
 * 
 * Available presets in Zustand store:
 * ────────────────────────────────────
 *   - "all-time": No date filtering (shows all data)
 *   - "today": Today's date only
 *   - "yesterday": Yesterday's date only
 *   - "this-week": Monday to Sunday of current week
 *   - "last-week": Monday to Sunday of previous week
 *   - "this-month": 1st to last day of current month
 *   - "last-month": 1st to last day of previous month
 *   - "this-year": January 1 to December 31 of current year
 *   - "last-year": January 1 to December 31 of previous year
 *   - "custom": User-specified date range (fromDate to toDate)
 * 
 * Implementation (in useSalesAnalyticsStore):
 * ──────────────────────────────────────────
 *   const getFilteredSalesRows = () => {
 *     const { salesRows, dateFilter } = get();
 *     if (!dateFilter.fromDate && !dateFilter.toDate) return salesRows;
 *     
 *     return salesRows.filter((row) => {
 *       if (dateFilter.fromDate && row.date < dateFilter.fromDate) return false;
 *       if (dateFilter.toDate && row.date > dateFilter.toDate) return false;
 *       return true;
 *     });
 *   };
 * 
 * All calculation functions then use getFilteredSalesRows() instead of raw sales data.
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 6. COLOR SCHEME
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * KPI Card Accents:
 * ─────────────────
 *   Blue (#60A5FA)     → Sales-related KPIs (Total Gross Sales, Transactions)
 *   Emerald (#22C55E)  → Profit-related KPIs (Net Profit, ATV)
 *   Amber (#F59E0B)    → Discount metrics (Discount %)
 *   Indigo (#6366F1)   → Volume/count KPIs (Units Sold)
 * 
 * Chart Colors:
 * ──────────────
 *   Area Chart (Sales Trend):
 *     - Blue: Gross Sales
 *     - Green: Net Profit
 * 
 *   Bar Chart (Hourly Sales):
 *     - Amber/Orange: Hourly Gross Sales
 * 
 *   Bar Chart (Top Products):
 *     - Cyan: Product Quantity
 * 
 *   Pie Chart (Department Breakdown):
 *     - Rotating palette of 6 colors (Blue → Cyan → Green → Amber → Pink → Purple)
 * 
 * Quick Insights Cards:
 * ─────────────────────
 *   Emerald border/bg: Top selling item
 *   Blue border/bg: Best performing cashier
 *   Amber border/bg: Highest sales date
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 7. EXAMPLE: FULL CALCULATION FLOW
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Step 1: User uploads 3 Excel files
 * ──────────────────────────────────
 *   - Sales_Report.xlsx
 *   - Fast_Moving_Report.xlsx
 *   - Product_Details.xlsx
 * 
 * Step 2: parseExcelReport() processes each file
 * ───────────────────────────────────────────────
 *   Sales Report:
 *     Raw rows: 1,250 rows (including headers, totals, empty)
 *     After cleaning: 892 valid sales rows
 *     Fields extracted: date, hour, cashier, trx no, item code, qty, sales, cost, discount, profit
 * 
 *   Fast Moving Report:
 *     Raw rows: 85 rows
 *     After cleaning: 78 valid product rows
 * 
 *   Product Catalog:
 *     Raw rows: 350 rows
 *     After cleaning: 320 valid product rows
 * 
 * Step 3: Data stored in Zustand store
 * ─────────────────────────────────────
 *   useSalesAnalyticsStore.setState({
 *     salesRows: [...892 processed rows...],
 *     fastMovingRows: [...78 rows...],
 *     productRows: [...320 rows...],
 *   })
 * 
 * Step 4: User sets date filter to "this-month"
 * ───────────────────────────────────────────────
 *   getFilteredSalesRows() returns only rows from Jan 1-31, 2024 (532 rows)
 * 
 * Step 5: Dashboard computes KPIs and charts
 * ──────────────────────────────────────────
 *   getOverviewKpis():
 *     totalGrossSales: 125,450
 *     totalNetProfit: 42,150
 *     totalUnitsSold: 8,234
 *     discountPercent: 2.3%
 *     transactionCount: 483
 *     averageTransactionValue: 259.94
 * 
 *   getQuickInsights():
 *     topSellingItem: "Paracetamol 500mg (500 units)"
 *     bestCashier: "Maria Cruz (₱48,200)"
 *     highestSalesDate: "2024-01-15 (₱4,250)"
 * 
 *   getOverviewCharts():
 *     salesTrend: [31 daily points]
 *     hourlyTrend: [24 hourly points]
 *     topProducts: [Top 10 by quantity]
 *     departmentBreakdown: [8 departments by value]
 * 
 * Step 6: UI renders Dashboard with KPI cards, charts, insights
 * ──────────────────────────────────────────────────────────────
 *   - 6 KPI cards at top with values and helpers
 *   - Daily sales trend area chart
 *   - Hourly sales trend bar chart
 *   - Quick insights sidebar with highlights
 *   - Top 10 products horizontal bar chart
 *   - Department breakdown donut chart
 * 
 * All numbers are formatted:
 *   - Currency: "₱1,250.50" (PHP locale)
 *   - Numbers: "1,250.50" (2 decimal places)
 *   - Percentages: "2.30%" (2 decimal places)
 *   - Dates: "January 15, 2024"
 *   - Hours: "09:00", "10:00", etc.
 */
