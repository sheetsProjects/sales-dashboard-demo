export const COL = {
  serial: 0,            // A — j
  project: 1,           // B
  month: 2,             // C — Months (e.g. April25)
  invoice_qty: 3,       // D — Invoice Quantity (= QTY SOLD)
  unit_price: 4,        // E
  invoice_inr: 5,       // F — Invoice Value INR
  customer: 6,          // G
  date: 7,              // H — invoice/shipment date
  destination: 8,       // I
  part_no: 9,           // J — PartNo
  fg_part_short: 10,    // K — FG Part No (short code, e.g. "10")
  fg_part: 11,          // L — FG Part No (10-digit numeric, the canonical ID)
  sales_order: 12,      // M
  customs_po: 13,       // N
  ex_rate: 14,          // O — Exchange rate
  obd: 15,              // P
  invoice_no: 16,       // Q
  invoice_date: 17,     // R
  invoice_usd: 18,      // S — Invoice Value USD
  currency: 19,         // T — USD / EURO

  // Per-unit Actual (cols W, X, Y)
  rm_lbp_pu: 22,        // W — RM LBP Cost (Actual /unit)
  rm_map_pu: 23,        // X — RM MAP Cost (Actual /unit)  ← used for RM Actual
  os_pu: 24,            // Y — OS Cost (Actual /unit)

  // Per-unit Budget (cols AA, AB)
  rm_pu_budget: 26,     // AA — RM Cost (Budgeted /unit)
  os_pu_budget: 27,     // AB — OS Cost (Budgeted /unit)

  // Quantities (cols AC, AE)
  qty_budget: 28,       // AC — Qty (Budgeted)
  qty_projected: 30,    // AE — QTY (Projected)
};

// Display-friendly labels (used by header/UI text)
export const COLUMNS = {
  serial: 'Sl.no',
  project: 'Project',
  month: 'Month',
  invoice_qty: 'Invoice Quantity',
  unit_price: 'Unit Price',
  invoice_inr: 'Invoice Value (INR)',
  customer: 'Customer',
  date: 'Date',
  destination: 'Destination',
  part_no: 'Part No',
  fg_part_short: 'FG Part Code',
  fg_part: 'FG Part No',
  sales_order: 'Sales Order',
  customs_po: 'Customs PO',
  ex_rate: 'Ex. Rate',
  obd: 'OBD No',
  invoice_no: 'Invoice No',
  invoice_date: 'Invoice Date',
  invoice_usd: 'Invoice Value (USD)',
  currency: 'Currency',
  rm_lbp_pu: 'RM LBP /unit',
  rm_map_pu: 'RM MAP /unit',
  os_pu: 'OS /unit',
  rm_pu_budget: 'RM Budget /unit',
  os_pu_budget: 'OS Budget /unit',
  qty_budget: 'Budgeted Qty',
  qty_projected: 'Projected Qty',
  // Computed (derived per row)
  bom_pu_actual: 'BOM /unit (Actual)',
  bom_pu_budget: 'BOM /unit (Budget)',
  po_price_pu: 'PO Price /unit',
  rm_actual: 'RM Actual',
  rm_budget: 'RM Budget',
  os_actual: 'OS Actual',
  os_budget: 'OS Budget',
  bom_actual: 'BOM Actual',
  bom_budget: 'BOM Budget',
  bom_variance: 'BOM Variance',
  bom_variance_pct: 'BOM Variance %',
  proj_bom_actual: 'Projected BOM Actual',
  proj_bom_budget: 'Projected BOM Budget',
  proj_variance: 'Projected Variance',
  margin_actual: 'Actual Margin',
  margin_budget: 'Budgeted Margin',
  margin_diff: 'Margin Difference',
};

export const HEADER_ROWS = 5;

export const DEFAULT_FX_RATE = 92.50;
