// ---------------------------------------------------------------------------
// Multi-sheet parser for the AutoGlobe workbook.
//   parseWorkbook(arrayBuffer) → { sales, inventory, locations, employees,
//                                  targets, expenses, customers, overview }
// Each sheet is read header-first (row 0 = column names) so a moved column
// won't break the parser. Sales/Inventory rows get a small set of derived
// fields (monthKey, ageBucket, etc.) so downstream pages don't recompute them.
// ---------------------------------------------------------------------------

import * as XLSX from 'xlsx';
import { SHEETS, AGE_BUCKETS, STORAGE_KEYS, SCHEMA_VERSION, LEGACY_KEYS } from './constants';

const num = (v) => {
  if (v === '' || v == null) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const str = (v) => (v == null ? '' : String(v).trim());

// SheetJS returns "2025-01-24" as either a string, a Date, or an Excel serial
// depending on cell formatting. Normalise everything to an ISO YYYY-MM-DD.
const toISO = (v) => {
  if (v == null || v === '') return '';
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === 'number' && Number.isFinite(v)) {
    // Excel serial → ms → ISO
    const ms = Math.round((v - 25569) * 86400000);
    const d = new Date(ms);
    return isNaN(d) ? '' : d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  // Already ISO-ish
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d) ? s : d.toISOString().slice(0, 10);
};

// "2025-01-24" → "2025-01" (used for month-level groupings & Targets/Expenses joins)
const toMonthKey = (iso) => (iso && iso.length >= 7 ? iso.slice(0, 7) : '');

const toYearKey = (iso) => (iso && iso.length >= 4 ? iso.slice(0, 4) : '');

// Read a sheet as an array of header-keyed objects. Empty rows dropped.
const readSheet = (wb, sheetName) => {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
};

const ageBucketFor = (daysListed) => {
  const d = num(daysListed);
  const b = AGE_BUCKETS.find((x) => d >= x.min && d <= x.max);
  return b ? b.key : 'stale';
};

const parseSalesRow = (r, i) => {
  const saleDate = toISO(r.SaleDate);
  const acquisitionDate = toISO(r.AcquisitionDate);
  const costPrice = num(r.CostPrice);
  const salePrice = num(r.SalePrice);
  const profit = num(r.Profit) || (salePrice - costPrice);
  const marginPct = num(r.MarginPct) || (salePrice ? (profit / salePrice) * 100 : 0);
  return {
    _id: i,
    saleId: str(r.SaleID),
    saleDate,
    monthKey: toMonthKey(saleDate),
    yearKey: toYearKey(saleDate),
    locationId: str(r.LocationID),
    location: str(r.Location),
    region: str(r.Region),
    vin: str(r.VIN),
    make: str(r.Make),
    model: str(r.Model),
    year: num(r.Year),
    bodyType: str(r.BodyType),
    fuelType: str(r.FuelType),
    transmission: str(r.Transmission),
    color: str(r.Color),
    mileage: num(r.Mileage),
    condition: str(r.Condition),
    costPrice,
    salePrice,
    profit,
    marginPct,
    acquisitionDate,
    daysInInventory: num(r.DaysInInventory),
    salesRep: str(r.SalesRep),
    customerId: str(r.CustomerID),
    customerName: str(r.CustomerName),
    customerEmail: str(r.CustomerEmail),
    customerAge: num(r.CustomerAge),
    customerGender: str(r.CustomerGender),
    salesChannel: str(r.SalesChannel),
    paymentType: str(r.PaymentType),
    warrantyIncluded: str(r.WarrantyIncluded),
    customerSatisfaction: num(r.CustomerSatisfaction),
  };
};

const parseInventoryRow = (r, i) => {
  const acquisitionDate = toISO(r.AcquisitionDate);
  const daysListed = num(r.DaysListed);
  const costPrice = num(r.CostPrice);
  const askingPrice = num(r.AskingPrice);
  return {
    _id: i,
    inventoryId: str(r.InventoryID),
    vin: str(r.VIN),
    locationId: str(r.LocationID),
    location: str(r.Location),
    make: str(r.Make),
    model: str(r.Model),
    year: num(r.Year),
    bodyType: str(r.BodyType),
    fuelType: str(r.FuelType),
    transmission: str(r.Transmission),
    color: str(r.Color),
    mileage: num(r.Mileage),
    condition: str(r.Condition),
    costPrice,
    askingPrice,
    expectedMargin: askingPrice ? ((askingPrice - costPrice) / askingPrice) * 100 : 0,
    acquisitionDate,
    daysListed,
    ageBucket: ageBucketFor(daysListed),
    status: str(r.Status),
  };
};

const parseLocationRow = (r) => ({
  id: str(r.id),
  city: str(r.city),
  country: str(r.country),
  region: str(r.region),
  currency: str(r.currency),
  manager: str(r.manager),
  opened: toISO(r.opened),
  sqft: num(r.sqft),
});

const parseEmployeeRow = (r) => ({
  employeeId: str(r.EmployeeID),
  name: str(r.Name),
  role: str(r.Role),
  locationId: str(r.LocationID),
  location: str(r.Location),
  hireDate: toISO(r.HireDate),
  salary: num(r.Salary),
});

const parseTargetRow = (r) => ({
  month: str(r.Month),
  locationId: str(r.LocationID),
  location: str(r.Location),
  revenueTarget: num(r.RevenueTarget),
  unitTarget: num(r.UnitTarget),
});

const parseExpenseRow = (r) => {
  const rent = num(r.Rent);
  const salaries = num(r.Salaries);
  const marketing = num(r.Marketing);
  const utilities = num(r.Utilities);
  const maintenance = num(r.Maintenance);
  const other = num(r.Other);
  const totalExpenses = num(r.TotalExpenses) || (rent + salaries + marketing + utilities + maintenance + other);
  return {
    month: str(r.Month),
    locationId: str(r.LocationID),
    location: str(r.Location),
    rent, salaries, marketing, utilities, maintenance, other, totalExpenses,
  };
};

const parseCustomerRow = (r) => ({
  customerId: str(r.CustomerID),
  name: str(r.Name),
  email: str(r.Email),
  age: num(r.Age),
  gender: str(r.Gender),
  location: str(r.Location),
  acquisitionChannel: str(r.AcquisitionChannel),
  firstPurchaseDate: toISO(r.FirstPurchaseDate),
  lifetimeValue: num(r.LifetimeValue),
});

export const parseWorkbook = (arrayBuffer) => {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const sales     = readSheet(wb, SHEETS.sales).map(parseSalesRow);
  const inventory = readSheet(wb, SHEETS.inventory).map(parseInventoryRow);
  const locations = readSheet(wb, SHEETS.locations).map(parseLocationRow);
  const employees = readSheet(wb, SHEETS.employees).map(parseEmployeeRow);
  const targets   = readSheet(wb, SHEETS.targets).map(parseTargetRow);
  const expenses  = readSheet(wb, SHEETS.expenses).map(parseExpenseRow);
  const customers = readSheet(wb, SHEETS.customers).map(parseCustomerRow);

  return { sales, inventory, locations, employees, targets, expenses, customers };
};

// Quota-safe localStorage setter. Writes that would exceed the ~5 MB browser
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

// One-time migration: wipe legacy BOM-era keys and any stale ag_* data whose
// schema doesn't match the current version. Idempotent — safe to run on every
// mount.
export const migrateStorage = () => {
  const version = localStorage.getItem(STORAGE_KEYS.schemaVersion);
  if (version && Number(version) === SCHEMA_VERSION) return;

  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));

  // Wipe our own namespace too (angles cache may be shaped differently).
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('ag_') && key !== STORAGE_KEYS.schemaVersion) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((k) => localStorage.removeItem(k));

  localStorage.setItem(STORAGE_KEYS.schemaVersion, String(SCHEMA_VERSION));
};
