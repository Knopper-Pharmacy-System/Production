# QUICK REFERENCE CARD - Manager Dashboard

## 📍 Component Location
```
frontend/src/features/salesAnalytics/components/OverviewDashboard.tsx
```

## 🎯 Quick Import
```tsx
import OverviewDashboard from "@/features/salesAnalytics/components/OverviewDashboard";

// Use it!
<OverviewDashboard />
```

## 📊 Dashboard Sections (In Order)

| Section | Type | Data | Colors |
|---------|------|------|--------|
| 1. Total Gross Sales | Card | PHP currency | Blue |
| 2. Total Net Profit | Card | PHP currency | Green |
| 3. Total Units Sold | Card | Integer | Indigo |
| 4. Discount Rate | Card | Percentage | Amber |
| 5. Transactions | Card | Count | Blue |
| 6. Avg Tx Value | Card | PHP currency | Green |
| 7. Daily Trend | Area Chart | 2 lines (gross, profit) | Blue & Green |
| 8. Quick Insights | Sidebar | 3 metrics | Emerald, Blue, Amber |
| 9. Hourly Trend | Bar Chart | 24 bars (0-23h) | Orange |
| 10. Top 10 Products | Horiz Bar | Item names + qty | Cyan |
| 11. Departments | Donut Chart | Department sales | Rainbow (6 colors) |

## 🔑 Key Functions

### Get KPIs
```tsx
const store = useSalesAnalyticsStore();
const kpis = store.getOverviewKpis();

// Returns: { totalGrossSales, totalNetProfit, totalUnitsSold, 
//           discountPercent, transactionCount, averageTransactionValue }
```

### Get Insights
```tsx
const insights = store.getQuickInsights();
// Returns: { topSellingItem, bestCashier, highestSalesDate }
```

### Get Charts
```tsx
const charts = store.getOverviewCharts();
// Returns: { salesTrend, hourlyTrend, topProducts, departmentBreakdown }
```

### Filter by Date
```tsx
store.setDatePreset("this-month");        // "today", "this-week", "this-month", "all-time"
store.setCustomDateRange("2024-01-01", "2024-01-31");
store.setDatePreset("all-time");          // Reset
```

## 📁 Data Input (Excel Files)

| File | Required? | Rows | Purpose |
|------|-----------|------|---------|
| Sales Transaction Report | ✅ YES | ~1000/month | Main data source |
| Fast Moving Report | ❌ Optional | ~50-200 | Validation |
| Product Catalog | ✅ YES | ~300-500 | Department lookup |

## 🧹 Data Cleaning Applied

### Sales Report
✗ Rows with TRX NO = "TOTAL"
✗ Empty rows
✗ Qty ≤ 0 or missing cashier
✓ Forward-fills missing dates
✓ Calculates missing profit

### Fast Moving Report
✗ Missing description AND item code
✗ Both qty ≤ 0 AND sales ≤ 0

### Product Catalog
✗ Missing description
✗ Missing item code AND barcode

## 🎨 Colors Quick Reference

| Use | Color | Hex |
|-----|-------|-----|
| Sales | Blue | #60A5FA |
| Profit | Green | #22C55E |
| Discount | Orange | #F59E0B |
| Units | Indigo | #6366F1 |
| Top Item | Emerald | #10B981 |
| Best Cashier | Blue | #3B82F6 |
| Best Date | Amber | #F59E0B |

## 📈 Calculation Formulas

```javascript
// Total Gross Sales
Σ(grossSales)

// Total Net Profit
Σ(netProfit)

// Total Units
Σ(qtySold)

// Discount %
(Σ discount / totalGrossSales) × 100

// Transactions
COUNT(UNIQUE transactionNo)

// Avg Transaction Value
totalGrossSales / transactionCount

// Daily Trend
GROUP BY date, SUM grossSales/netProfit/units

// Hourly Trend
GROUP BY hour (0-23), SUM grossSales, COUNT transactions

// Top Products
GROUP BY description, SUM qty, TOP 10

// Department Breakdown
LOOKUP itemCode in catalog → GET department
GROUP BY department, SUM grossSales
```

## 🔄 Data Flow

```
Excel Files
    ↓
Parse → Clean → Store
    ↓
Apply Date Filter
    ↓
Calculate Metrics
    ↓
Render Dashboard
```

## 🛠️ Common Tasks

### Show All-Time Data
```tsx
useSalesAnalyticsStore().setDatePreset("all-time");
```

### Show This Month Only
```tsx
useSalesAnalyticsStore().setDatePreset("this-month");
```

### Get Top Selling Item Name
```tsx
const item = useSalesAnalyticsStore().getQuickInsights().topSellingItem;
```

### Get Daily Trend Data
```tsx
const trend = useSalesAnalyticsStore().getOverviewCharts().salesTrend;
trend.forEach(day => console.log(`${day.date}: ₱${day.grossSales}`));
```

### Get Department Sales
```tsx
const depts = useSalesAnalyticsStore().getOverviewCharts().departmentBreakdown;
depts.forEach(dept => console.log(`${dept.department}: ₱${dept.value}`));
```

## 📱 Responsive Breakpoints

| Device | Layout |
|--------|--------|
| Mobile (<640px) | Single column (stack) |
| Tablet (640-1024px) | 2-3 columns |
| Desktop (>1024px) | Full 6-column grid |

## ✅ Empty State Handler

When no data is loaded:
```
"Overview will appear here"
"Upload your Sales Transaction report first..."
```

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "No data yet" on KPIs | Upload files first |
| Wrong numbers | Check date filter, verify Excel format |
| Missing department | Product catalog lookup failed |
| Hour mismatch | Time column format incorrect in Excel |
| Blank charts | No data for selected date range |

## 📖 Documentation Files

- **README.md** - Full implementation guide (2000+ lines)
- **analyticsCalculations.ts** - Calculation examples (1000+ lines)
- **DASHBOARD_SUMMARY.md** - Overview of features (800+ lines)
- **VISUAL_GUIDE.md** - Layout diagrams (600+ lines)

## 🎯 Next Steps

1. Import `OverviewDashboard` component
2. Upload 3 Excel files
3. Dashboard renders automatically
4. Add date filter UI (optional)
5. Customize styling (if needed)
6. Add additional KPIs/charts (if needed)

## 📞 Need Help?

1. Check VISUAL_GUIDE.md for diagram
2. Check README.md for detailed explanation
3. Check analyticsCalculations.ts for formula examples
4. Review component code - well commented

---

**Everything is production-ready! 🚀**
