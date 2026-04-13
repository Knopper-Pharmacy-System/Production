/**
 * DASHBOARD OVERVIEW - VISUAL REFERENCE GUIDE
 * 
 * This file provides visual representations of:
 * 1. Component layout
 * 2. Data flow
 * 3. KPI calculations
 * 4. Chart aggregations
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SECTION 1: DASHBOARD LAYOUT
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* 
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ PHARMACY MANAGER DASHBOARD - OVERVIEW TAB                               │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                          │
  │  ┌─────────────────────────────────────────────────────────────────┐   │
  │  │ KPI CARDS (6-column grid on desktop, responsive on mobile)      │   │
  │  │                                                                 │   │
  │  │ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │   │
  │  │ │  Total Gross     │ │  Total Net       │ │  Total Units     │ │   │
  │  │ │  Sales           │ │  Profit          │ │  Sold            │ │   │
  │  │ │                  │ │                  │ │                  │ │   │
  │  │ │  PHP 125,450.00  │ │  PHP 42,150.00   │ │  8,234 units     │ │   │
  │  │ │  (Blue)          │ │  (Green)         │ │  (Indigo)        │ │   │
  │  │ └──────────────────┘ └──────────────────┘ └──────────────────┘ │   │
  │  │                                                                 │   │
  │  │ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │   │
  │  │ │  Discount Rate   │ │  Transactions    │ │  Avg Tx Value    │ │   │
  │  │ │                  │ │                  │ │                  │ │   │
  │  │ │  2.30%           │ │  483             │ │  PHP 259.94      │ │   │
  │  │ │  (Amber)         │ │  (Blue)          │ │  (Green)         │ │   │
  │  │ └──────────────────┘ └──────────────────┘ └──────────────────┘ │   │
  │  │                                                                 │   │
  │  └─────────────────────────────────────────────────────────────────┘   │
  │                                                                          │
  │  ┌──────────────────────────────────────────┐ ┌──────────────────────┐ │
  │  │ DAILY SALES TREND (2/3 width)            │ │ QUICK INSIGHTS (1/3) │ │
  │  │                                          │ │                      │ │
  │  │  [Area Chart - Blue & Green Lines]       │ │ ┌──────────────────┐ │ │
  │  │                                          │ │ │ ✓ Top Item       │ │ │
  │  │     ▲                                    │ │ │   Paracetamol    │ │ │
  │  │     │        ╱╲                          │ │ │   (Green Badge)  │ │ │
  │  │     │  ╱────╱  ╲────╲                   │ │ └──────────────────┘ │ │
  │  │     │ ╱            ╲                    │ │                      │ │
  │  │     ├────────────────────────           │ │ ┌──────────────────┐ │ │
  │  │     │ Jan  Feb  Mar  Apr                │ │ │ ✓ Best Cashier   │ │ │
  │  │     └                                    │ │ │   Maria (₱48.2k) │ │ │
  │  │                                          │ │ │   (Blue Badge)   │ │ │
  │  │  ─ Gross Sales (Blue)                   │ │ └──────────────────┘ │ │
  │  │  ─ Net Profit (Green)                   │ │                      │ │
  │  └──────────────────────────────────────────┘ │ ┌──────────────────┐ │ │
  │                                                │ │ ✓ Highest Date   │ │ │
  │  ┌───────────────────────────────────────────┐ │   Jan 15, 2024   │ │ │
  │  │ HOURLY SALES TREND (Bar Chart)            │ │   (Amber Badge)  │ │ │
  │  │                                           │ │ └──────────────────┘ │ │
  │  │ Sales ▲                                   │ │                      │ │
  │  │       │    ╭─╮    ╭─╮    ╭─╮             │ │                      │ │
  │  │       │    │ │╭─╮│ │╭─╮│ │              │ │                      │ │
  │  │       │╭─╮ │ ││ ││ ││ ││ ││              │ │                      │ │
  │  │       │││ │ │ ││ ││ ││ ││ │              │ │                      │ │
  │  │   ────┼─┼─┼─┼┼─┼┼─┼┼─┼┼─┼──────         │ │ ┌──────────────────┐ │ │
  │  │       │00 01 02 03...  22 23             │ │ │ (Additional info │ │ │
  │  │       │ Hours of Day                     │ │ │  fits here too)  │ │ │
  │  │       └                                   │ │ └──────────────────┘ │ │
  │  │                                           │ └──────────────────────┘ │
  │  │ Peak hours: 9-10 AM, 12-1 PM, 6-7 PM    │                          │
  │  └───────────────────────────────────────────┘                          │
  │                                                                          │
  │  ┌────────────────────────────────┐ ┌─────────────────────────────┐   │
  │  │ TOP 10 PRODUCTS BY QUANTITY     │ │ DEPARTMENT BREAKDOWN        │   │
  │  │ (Horizontal Bar Chart)          │ │ (Donut Chart)               │   │
  │  │                                 │ │                             │   │
  │  │ Paracetamol ████████│ 234      │ │         Pain Relief (30%)   │   │
  │  │ Ibuprofen   ███████│  189      │ │         Vitamins (25%)      │   │
  │  │ Vitamin C   ██████│   156      │ │         Cough/Cold (20%)    │   │
  │  │ Omeprazole  ██████│   142      │ │         Digestives (15%)    │   │
  │  │ Cough Syrup ████│    98       │ │         Antibiotics (10%)   │   │
  │  │ ...                             │ │                             │   │
  │  │                                 │ │                             │   │
  │  └────────────────────────────────┘ └─────────────────────────────┘   │
  │                                                                          │
  └─────────────────────────────────────────────────────────────────────────┘
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SECTION 2: DATA FLOW PIPELINE
 * ═══════════════════════════════════════════════════════════════════════════
 */

/*
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 1: USER UPLOADS EXCEL FILES                                         │
  ├──────────────────────────────────────────────────────────────────────────┤
  │                                                                           │
  │  File Selection via SmartReportUploader:                                │
  │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌────────┐  │
  │  │ Sales_Report.xlsx       │  │ FastMoving_Report.xlsx  │  │Product │  │
  │  │ (1250 raw rows)         │  │ (85 raw rows)           │  │Catalog │  │
  │  │                         │  │                         │  │(350)   │  │
  │  └────────┬────────────────┘  └────────┬────────────────┘  └───┬────┘  │
  │           │                           │                       │        │
  │           └──────────────┬────────────┴────────────────┬──────┘        │
  │                          │                            │                 │
  └──────────────────────────┼────────────────────────────┼─────────────────┘
                             │                            │
  ┌──────────────────────────┼────────────────────────────┼─────────────────┐
  │ STEP 2: PARSE EXCEL FILES (reportParsers.ts)         │                 │
  ├──────────────────────────┼────────────────────────────┼─────────────────┤
  │                          │                            │                 │
  │   For SALES Report:                                   │                 │
  │   ├─ Auto-detect headers                              │                 │
  │   ├─ Extract rows                                     │                 │
  │   ├─ Clean data:                                      │                 │
  │   │  ✗ Skip TRX NO = "TOTAL"                          │                 │
  │   │  ✗ Skip empty rows                                │                 │
  │   │  ✗ Skip qty ≤ 0 or missing cashier                │                 │
  │   │  ✓ Forward-fill dates                             │                 │
  │   │  ✓ Parse dates: "1/15" → "2024-01-15"             │                 │
  │   │  ✓ Calculate NET PROFIT if missing                │                 │
  │   ├─ Result: 892 valid rows                           │                 │
  │   └─ Output: SalesRow[]                               │                 │
  │                                                        │                 │
  │   For FAST MOVING Report:       For PRODUCT Catalog: │                 │
  │   ├─ Auto-detect headers        ├─ Auto-detect head  │                 │
  │   ├─ Extract rows               ├─ Extract rows      │                 │
  │   ├─ Clean data:                ├─ Clean data:       │                 │
  │   │  ✗ Skip if no desc & code   │  ✗ Skip no desc    │                 │
  │   │  ✓ Result: 78 valid rows    │  ✓ Result: 320     │                 │
  │   └─ Output: FastMovingRow[]    └─ Output: Product   │                 │
  │                                    CatalogRow[]      │                 │
  │                                                        │                 │
  └────────────────────────────────────────────────────────┼─────────────────┘
                                                           │
  ┌────────────────────────────────────────────────────────┼─────────────────┐
  │ STEP 3: STORE DATA IN ZUSTAND (useSalesAnalyticsStore.ts)              │
  ├────────────────────────────────────────────────────────┼─────────────────┤
  │                                                        │                 │
  │  State saved:                                          │                 │
  │  ├─ salesRows: 892 rows                                │                 │
  │  ├─ fastMovingRows: 78 rows                            │                 │
  │  ├─ productRows: 320 rows                              │                 │
  │  ├─ dateFilter: { preset: "all-time", ... }            │                 │
  │  └─ (Persisted to localStorage!)                       │                 │
  │                                                        │                 │
  └────────────────────────────────────────────────────────┼─────────────────┘
                                                           │
  ┌────────────────────────────────────────────────────────┼─────────────────┐
  │ STEP 4: APPLY DATE FILTER                              │                 │
  ├────────────────────────────────────────────────────────┼─────────────────┤
  │                                                        │                 │
  │  User selects date range (e.g., "this-month")         │                 │
  │  ↓                                                      │                 │
  │  getFilteredSalesRows() called:                        │                 │
  │  ├─ Takes dateFilter state                             │                 │
  │  ├─ Filters salesRows by date range                    │                 │
  │  │  (fromDate ≤ row.date ≤ toDate)                     │                 │
  │  ├─ 892 rows → 532 rows (for Jan 1-31, 2024)           │                 │
  │  └─ Returns: SalesRow[] (filtered)                     │                 │
  │                                                        │                 │
  │  This filtered result is used by ALL calculations:    │                 │
  │  └─ KPIs, insights, charts all use getFilteredRows()  │                 │
  │                                                        │                 │
  └────────────────────────────────────────────────────────┼─────────────────┘
                                                           │
  ┌────────────────────────────────────────────────────────┼─────────────────┐
  │ STEP 5: CALCULATE OVERVIEW METRICS                     │                 │
  ├────────────────────────────────────────────────────────┼─────────────────┤
  │                                                        │                 │
  │  getOverviewKpis():                                    │                 │
  │  ├─ totalGrossSales = Σ(gross from 532 rows)           │                 │
  │  ├─ totalNetProfit = Σ(profit from 532 rows)           │                 │
  │  ├─ totalUnitsSold = Σ(qty from 532 rows)              │                 │
  │  ├─ discountPercent = (Σ discount / total) × 100       │                 │
  │  ├─ transactionCount = COUNT(UNIQUE trx nos)           │                 │
  │  └─ averageTransactionValue = totalGross / txCount     │                 │
  │                                                        │                 │
  │  getQuickInsights():                                   │                 │
  │  ├─ topSellingItem = Item with MAX(qty)                │                 │
  │  ├─ bestCashier = Cashier with MAX(sales)              │                 │
  │  └─ highestSalesDate = Date with MAX(sales)            │                 │
  │                                                        │                 │
  │  getOverviewCharts():                                  │                 │
  │  ├─ salesTrend: GROUP BY date → [31 points]            │                 │
  │  ├─ hourlyTrend: GROUP BY hour → [24 points] ← NEW!    │                 │
  │  ├─ topProducts: GROUP BY item, TOP 10                  │                 │
  │  └─ departments: GROUP BY dept (via catalog lookup)    │                 │
  │                                                        │                 │
  └────────────────────────────────────────────────────────┼─────────────────┘
                                                           │
  ┌────────────────────────────────────────────────────────┼─────────────────┐
  │ STEP 6: RENDER DASHBOARD (OverviewDashboard.tsx)      │                 │
  ├────────────────────────────────────────────────────────┼─────────────────┤
  │                                                        │                 │
  │  OverviewDashboard component:                          │                 │
  │  ├─ Fetch: kpis = getOverviewKpis()                    │                 │
  │  ├─ Fetch: insights = getQuickInsights()               │                 │
  │  ├─ Fetch: charts = getOverviewCharts()                │                 │
  │  │                                                      │                 │
  │  ├─ Render KPI Cards:                                  │                 │
  │  │  └─ 6 cards with values + helpers                   │                 │
  │  │                                                      │                 │
  │  ├─ Render Charts:                                     │                 │
  │  │  ├─ Daily sales trend (area)                        │                 │
  │  │  ├─ Quick insights (sidebar)                        │                 │
  │  │  ├─ Hourly trend (bar) ← NEW!                       │                 │
  │  │  ├─ Top 10 products (horiz bar)                     │                 │
  │  │  └─ Department breakdown (donut)                    │                 │
  │  │                                                      │                 │
  │  └─ All with Tailwind styling + Recharts              │                 │
  │                                                        │                 │
  └────────────────────────────────────────────────────────┼─────────────────┘
                                                           │
  ┌────────────────────────────────────────────────────────┼─────────────────┐
  │ RESULT: Beautiful Dashboard Displayed! 🎉              │                 │
  └────────────────────────────────────────────────────────┼─────────────────┘
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SECTION 3: KPI CALCULATION EXAMPLES
 * ═══════════════════════════════════════════════════════════════════════════
 */

/*
  EXAMPLE: Calculating KPIs for January 2024
  
  Input: 532 sales rows (all from Jan 1-31, 2024 after filters)
  
  Sample rows:
  ─────────────────────────────────────────────────────────────────
  DATE       TIME  CASHIER  TRX NO  ITEM CODE  QTY  GROSS  PROFIT
  ─────────────────────────────────────────────────────────────────
  2024-01-15  9:30  Maria    001     PARA500    2     250     100
  2024-01-15  9:31  Maria    001     IBUP400    1     180      55
  2024-01-15 10:15  John     002     VITE500    5     500     200
  2024-01-16  9:00  Maria    003     PARA500    3     375     150
  ...
  ─────────────────────────────────────────────────────────────────
  
  CALCULATION 1: Total Gross Sales
  ──────────────────────────────────
  Formula: Σ(GROSS)
  
  Row 1: 250
  + Row 2: 180
  + Row 3: 500
  + Row 4: 375
  + ... (528 more rows)
  ──────────────────
  = 125,450 PHP
  
  Rendered as: "PHP 125,450.00" (blue card)
  
  
  CALCULATION 2: Total Net Profit
  ────────────────────────────────
  Formula: Σ(PROFIT)
  
  Row 1: 100
  + Row 2: 55
  + Row 3: 200
  + Row 4: 150
  + ... (528 more rows)
  ──────────────────
  = 42,150 PHP
  
  Rendered as: "PHP 42,150.00" (green card)
  
  
  CALCULATION 3: Total Units Sold
  ────────────────────────────────
  Formula: Σ(QTY)
  
  Row 1: 2
  + Row 2: 1
  + Row 3: 5
  + Row 4: 3
  + ... (528 more rows)
  ──────────────────
  = 8,234 units
  
  Rendered as: "8,234 units" (indigo card)
  
  
  CALCULATION 4: Discount Rate (%)
  ──────────────────────────────────
  Formula: (Σ DISCOUNT / Σ GROSS SALES) × 100
  
  Assume DISCOUNT column in data:
  
  Total Discounts = 2,885
  Total Gross Sales = 125,450
  
  Discount % = (2,885 / 125,450) × 100 = 2.30%
  
  Rendered as: "2.30%" (amber card)
  
  
  CALCULATION 5: Number of Transactions
  ───────────────────────────────────────
  Formula: COUNT(UNIQUE TRX NO)
  
  Unique TRX NOs: 001, 002, 003, ... 483
  (Note: May have multiple rows per TRX NO if multi-item transactions)
  
  Transaction Count = 483
  
  Rendered as: "483" (blue card)
  
  
  CALCULATION 6: Average Transaction Value
  ──────────────────────────────────────────
  Formula: Total Gross Sales / Transaction Count
  
  ATV = 125,450 / 483
      = 259.94
  
  Rendered as: "PHP 259.94" (green card)
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SECTION 4: CHART DATA AGGREGATIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/*
  CHART 1: Daily Sales Trend
  ───────────────────────────
  
  Process: GROUP BY DATE, SUM metrics
  
  Raw rows for Jan 1-31, 2024 (532 rows)
  │
  ├─ Jan 15: 8 rows
  │  Row 1: GROSS=250, PROFIT=100
  │  Row 2: GROSS=180, PROFIT=55
  │  Row 3: GROSS=500, PROFIT=200
  │  Row 4: GROSS=375, PROFIT=150
  │  Row 5: GROSS=280, PROFIT=112
  │  Row 6: GROSS=225, PROFIT=90
  │  Row 7: GROSS=410, PROFIT=164
  │  Row 8: GROSS=155, PROFIT=62
  │  ─────────────────────────
  │  Sum: GROSS=2,375, PROFIT=933, QTY=45
  │
  ├─ Jan 16: 6 rows
  │  Sum: GROSS=2,980, PROFIT=1,192, QTY=52
  │
  ├─ Jan 17: 5 rows
  │  Sum: GROSS=2,150, PROFIT=860, QTY=38
  │
  ... (31 aggregations total)
  
  Output: Array of 31 points
  [
    { date: "2024-01-01", grossSales: 1,200, netProfit: 480, units: 25 },
    { date: "2024-01-02", grossSales: 2,100, netProfit: 840, units: 35 },
    ...
    { date: "2024-01-31", grossSales: 1,800, netProfit: 720, units: 30 },
  ]
  
  Rendered as: Area chart with 2 lines (blue=gross, green=profit)
  
  
  CHART 2: Hourly Sales Trend (NEW!)
  ──────────────────────────────────
  
  Process: GROUP BY HOUR (0-23), COUNT UNIQUE TRX NO
  
  Raw rows (all 532 rows, from any date in Jan)
  │
  ├─ Hour 00 (midnight): 0 rows
  │  Sum: GROSS=0, TXN_COUNT=0
  │
  ├─ Hour 01-07: 22 total rows
  │  Sum: GROSS=4,300, TXN_COUNT=15
  │
  ├─ Hour 08: 45 rows
  │  Sum: GROSS=11,200, TXN_COUNT=42
  │
  ├─ Hour 09: 68 rows ← PEAK!
  │  Sum: GROSS=17,000, TXN_COUNT=58
  │
  ├─ Hour 10: 62 rows ← PEAK!
  │  Sum: GROSS=15,500, TXN_COUNT=52
  │
  ├─ Hour 11-12: 95 rows ← PEAK PERIOD!
  │  Sum: GROSS=23,800, TXN_COUNT=85
  │
  ├─ Hour 13-17: 85 rows
  │  Sum: GROSS=21,250, TXN_COUNT=75
  │
  ├─ Hour 18-22: 48 rows
  │  Sum: GROSS=9,400, TXN_COUNT=35
  │
  └─ Hour 23: 7 rows
     Sum: GROSS=1,200, TXN_COUNT=5
  
  Output: Array of 24 points (hours 0-23)
  [
    { hour: 0, grossSales: 0, transactionCount: 0 },
    { hour: 1, grossSales: 0, transactionCount: 0 },
    ...
    { hour: 9, grossSales: 17000, transactionCount: 58 },  ← Peak
    { hour: 10, grossSales: 15500, transactionCount: 52 },
    ...
    { hour: 23, grossSales: 1200, transactionCount: 5 },
  ]
  
  Rendered as: Bar chart (orange bars)
  X-axis: "00:00", "01:00", ..., "23:00"
  Y-axis: Gross Sales amount
  
  
  CHART 3: Top 10 Products
  ────────────────────────
  
  Process: GROUP BY DESCRIPTION, SUM QTY, TOP 10
  
  Item aggregations:
  Paracetamol 500mg: 50 + 30 + 40 + 25 + 35 + 28 + 26 = 234 units
  Ibuprofen 400mg: 25 + 15 + 20 + 18 + 22 + 23 + 26 + 20 = 189 units
  Vitamin C 500mg: 20 + 15 + 18 + 22 + 25 + 20 + 20 + 16 = 156 units
  Omeprazole 20mg: 18 + 15 + 16 + 19 + 20 + 18 + 21 + 15 = 142 units
  Cough Syrup: 15 + 12 + 14 + 16 + 18 + 13 + 10 + 0 = 98 units
  ...
  
  Sort by qty descending, take TOP 10
  
  Output:
  [
    { item: "Paracetamol 500mg", qtySold: 234 },
    { item: "Ibuprofen 400mg", qtySold: 189 },
    { item: "Vitamin C 500mg", qtySold: 156 },
    { item: "Omeprazole 20mg", qtySold: 142 },
    { item: "Cough Syrup", qtySold: 98 },
    ...
    { item: "Product #10", qtySold: 45 },
  ]
  
  Rendered as: Horizontal bar chart (cyan bars)
  
  
  CHART 4: Department Breakdown
  ──────────────────────────────
  
  Process: 
  1. For each sales row, LOOKUP item code in Product Catalog
  2. Get DEPARTMENT from catalog
  3. GROUP sales by department
  4. SUM GROSS SALES per department
  
  Example:
  
  Sales row: ITEM CODE = "PARA500", GROSS SALES = 250
  └─ Lookup in catalog: PARA500 → department = "Pain Relief"
  └─ Add 250 to "Pain Relief" total
  
  Sales row: ITEM CODE = "VITE500", GROSS SALES = 500
  └─ Lookup in catalog: VITE500 → department = "Vitamins"
  └─ Add 500 to "Vitamins" total
  
  ... (for all 532 rows)
  
  Department totals:
  Pain Relief: 30,000
  Vitamins: 25,000
  Cough & Cold: 20,000
  Digestives: 15,000
  Antibiotics: 10,000
  Uncategorized (not in catalog): 1,200
  
  Output (sorted by value):
  [
    { department: "Pain Relief", value: 30000 },
    { department: "Vitamins", value: 25000 },
    { department: "Cough & Cold", value: 20000 },
    { department: "Digestives", value: 15000 },
    { department: "Antibiotics", value: 10000 },
    { department: "Uncategorized", value: 1200 },
  ]
  
  Rendered as: Donut chart (multi-color - 6 color palette rotating)
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SECTION 5: COLOR SCHEME REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 */

/*
  KPI CARD ACCENTS:
  ─────────────────
  
  Blue (#60A5FA) - Sales Related
  ├─ Total Gross Sales card
  └─ Number of Transactions card
  
  Emerald/Green (#22C55E) - Profit Related
  ├─ Total Net Profit card
  └─ Average Transaction Value card
  
  Amber/Orange (#F59E0B) - Discount/Alert
  └─ Total Discount % card
  
  Indigo/Purple (#6366F1) - Volume/Count
  └─ Total Units Sold card
  
  
  CHART COLORS:
  ─────────────
  
  Area Chart (Daily Sales Trend):
  ├─ Blue (#60A5FA) - Gross Sales line
  └─ Green (#22C55E) - Net Profit line
  
  Bar Chart (Hourly Trend):
  └─ Orange (#F59E0B) - Hourly bars
  
  Bar Chart (Top Products):
  └─ Cyan (#06B6D4) - Product quantity bars
  
  Donut Chart (Department Breakdown):
  ├─ Blue (#60a5fa)
  ├─ Cyan (#38bdf8)
  ├─ Green (#22c55e)
  ├─ Amber (#f59e0b)
  ├─ Pink (#fb7185)
  └─ Purple (#a78bfa)
  (Cycling through 6 colors for each department)
  
  
  QUICK INSIGHTS BADGES:
  ──────────────────────
  
  Top Selling Item:
  ├─ Background: Emerald-50 (#F0FDF4)
  ├─ Border: Emerald-200 (#DCFCE7)
  ├─ Text: Emerald-700 (#047857)
  └─ Dot: Emerald-500 (#10B981)
  
  Best Cashier:
  ├─ Background: Blue-50 (#EFF6FF)
  ├─ Border: Blue-200 (#BFDBFE)
  ├─ Text: Blue-700 (#1D4ED8)
  └─ Dot: Blue-500 (#3B82F6)
  
  Highest Sales Date:
  ├─ Background: Amber-50 (#FFFBEB)
  ├─ Border: Amber-200 (#FED7AA)
  ├─ Text: Amber-700 (#B45309)
  └─ Dot: Amber-500 (#F59E0B)
*/
