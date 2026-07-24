// ---------------------------------------------------------------------------
// Two-stage parser for the GIVEN DATA SHEET upload format.
//   1. parseGivenRow  — pulls raw GIVEN cells into a compact object.
//                       This is the only thing we persist to localStorage.
//   2. withDerived    — given a parsed GIVEN row, returns a new row with all
//                       computed fields (Actual / Budget / Variance / Projected
//                       / Margin / cost ratios) and legacy aliases attached.
// On every upload AND every reload we run withDerived so the dashboard always
// works with a fully enriched row.
// ---------------------------------------------------------------------------

import { COL } from './constants';

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const str = (v) => (v == null ? '' : String(v).trim());

// Stage 1 — minimal GIVEN-only object; safe to persist to localStorage.
export const parseGivenRow = (r, i) => ({
  _id: i,
  serial: num(r[COL.serial]) || i + 1,
  project: str(r[COL.project]),
  month: str(r[COL.month]),
  invoice_qty: num(r[COL.invoice_qty]),
  unit_price: num(r[COL.unit_price]),
  invoice_inr: num(r[COL.invoice_inr]),
  customer: str(r[COL.customer]),
  date: r[COL.date],
  destination: str(r[COL.destination]),
  part_no: str(r[COL.part_no]),
  fg_part_short: str(r[COL.fg_part_short]),
  fg_part: str(r[COL.fg_part]),
  sales_order: str(r[COL.sales_order]),
  customs_po: str(r[COL.customs_po]),
  ex_rate: num(r[COL.ex_rate]),
  obd: str(r[COL.obd]),
  invoice_no: str(r[COL.invoice_no]),
  invoice_date: r[COL.invoice_date],
  invoice_usd: num(r[COL.invoice_usd]),
  currency: str(r[COL.currency]),
  rm_lbp_pu: num(r[COL.rm_lbp_pu]),
  rm_map_pu: num(r[COL.rm_map_pu]),
  os_pu: num(r[COL.os_pu]),
  rm_pu_budget: num(r[COL.rm_pu_budget]),
  os_pu_budget: num(r[COL.os_pu_budget]),
  qty_budget: num(r[COL.qty_budget]),
  qty_projected: num(r[COL.qty_projected]),
});

// Stage 2 — attach every derived field + legacy alias to a GIVEN row.
export const withDerived = (g) => {
  const bom_pu_actual = g.rm_map_pu + g.os_pu;
  const bom_pu_budget = g.rm_pu_budget + g.os_pu_budget;
  const po_price_pu = g.unit_price * g.ex_rate;

  const rm_actual = g.invoice_qty * g.rm_map_pu;
  const rm_budget = g.invoice_qty * g.rm_pu_budget;
  const os_actual = g.invoice_qty * g.os_pu;
  const os_budget = g.invoice_qty * g.os_pu_budget;
  const bom_actual = rm_actual + os_actual;
  const bom_budget = rm_budget + os_budget;
  const bom_variance = bom_budget - bom_actual;
  const bom_variance_pct = bom_actual ? bom_variance / bom_actual : 0;

  const proj_bom_actual = bom_pu_actual * g.qty_projected;
  const proj_bom_budget = bom_pu_budget * g.qty_projected;
  const proj_variance = proj_bom_budget - proj_bom_actual;
  const proj_variance_pct = proj_bom_actual ? proj_variance / proj_bom_actual : 0;

  const margin_actual = po_price_pu - bom_pu_actual;
  const margin_budget = po_price_pu - bom_pu_budget;
  const margin_diff = margin_actual - margin_budget;
  const margin_diff_pct = po_price_pu ? margin_diff / po_price_pu : 0;

  const lbp_pct = po_price_pu ? g.rm_lbp_pu / po_price_pu : 0;
  const map_pct = po_price_pu ? g.rm_map_pu / po_price_pu : 0;
  const os_pct = po_price_pu ? g.os_pu / po_price_pu : 0;
  const bom_pct = po_price_pu ? bom_pu_actual / po_price_pu : 0;

  return {
    ...g,
    bom_pu_actual,
    bom_pu_budget,
    po_price_pu,
    rm_actual,
    rm_budget,
    os_actual,
    os_budget,
    bom_actual,
    bom_budget,
    bom_variance,
    bom_variance_pct,
    proj_bom_actual,
    proj_bom_budget,
    proj_variance,
    proj_variance_pct,
    margin_actual,
    margin_budget,
    margin_diff,
    margin_diff_pct,
    lbp_pct,
    map_pct,
    os_pct,
    bom_pct,

    // Legacy aliases (kept for components not yet migrated)
    sl: g.serial,
    sales: g.invoice_inr,
    actual_qty: g.invoice_qty,
    budget_qty: g.qty_budget,
    total_rm: rm_actual,
    total_os: os_actual,
    total_bom: bom_actual,
    total_rm_budget: rm_budget,
    total_os_budget: os_budget,
    budget_cost: bom_budget,
    avb_2526: bom_variance,
    avb_2627: proj_variance,
    actual_rm: g.rm_map_pu,
    actual_os: g.os_pu,
    budget_rm: g.rm_pu_budget,
    budget_os: g.os_pu_budget,
    bom_assy: bom_pu_actual,
    lbp_rm: g.rm_lbp_pu,
    map_rm: g.rm_map_pu,
    po_inr: po_price_pu,
    po_usd: g.unit_price,
  };
};

// Convenience: parse + derive in one call.
export const parseRow = (r, i) => withDerived(parseGivenRow(r, i));

// Quota-safe localStorage setter. Writes that would exceed the 5 MB browser
// limit are dropped with a console warning instead of throwing.
export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`[localStorage] skipped "${key}" — ${e.name}: ${e.message}`);
    return false;
  }
};
