// ---------------------------------------------------------------------------
// AutoGlobe Motors — Used Car Dashboard schema.
// The workbook has 8 sheets; each has its own header row and column layout.
// SHEETS.<name> holds the sheet name; COLS.<name> holds column indices used
// by parseWorkbook.js. LOCATIONS is the canonical list of the 4 branches.
// ---------------------------------------------------------------------------

export const APP_NAME = 'AutoGlobe Sales Dashboard';

export const SHEETS = {
  overview: 'Overview',
  sales: 'Sales',
  inventory: 'Inventory',
  locations: 'Locations',
  employees: 'Employees',
  targets: 'Targets',
  expenses: 'Expenses',
  customers: 'Customers',
};

// Column indices per sheet (0-based). Kept for reference; parseWorkbook.js
// uses header-key access (sheet_to_json without header:1) so a moved column
// won't break the parser, but constants stay accurate for docs / dev tools.
export const COLS = {
  sales: {
    saleId: 0, saleDate: 1, locationId: 2, location: 3, region: 4,
    vin: 5, make: 6, model: 7, year: 8, bodyType: 9, fuelType: 10,
    transmission: 11, color: 12, mileage: 13, condition: 14,
    costPrice: 15, salePrice: 16, profit: 17, marginPct: 18,
    acquisitionDate: 19, daysInInventory: 20, salesRep: 21,
    customerId: 22, customerName: 23, customerEmail: 24,
    customerAge: 25, customerGender: 26, salesChannel: 27,
    paymentType: 28, warrantyIncluded: 29, customerSatisfaction: 30,
  },
  inventory: {
    inventoryId: 0, vin: 1, locationId: 2, location: 3,
    make: 4, model: 5, year: 6, bodyType: 7, fuelType: 8,
    transmission: 9, color: 10, mileage: 11, condition: 12,
    costPrice: 13, askingPrice: 14, acquisitionDate: 15,
    daysListed: 16, status: 17,
  },
  locations: {
    id: 0, city: 1, country: 2, region: 3, currency: 4,
    manager: 5, opened: 6, sqft: 7,
  },
  employees: {
    employeeId: 0, name: 1, role: 2, locationId: 3,
    location: 4, hireDate: 5, salary: 6,
  },
  targets: {
    month: 0, locationId: 1, location: 2, revenueTarget: 3, unitTarget: 4,
  },
  expenses: {
    month: 0, locationId: 1, location: 2, rent: 3, salaries: 4,
    marketing: 5, utilities: 6, maintenance: 7, other: 8, totalExpenses: 9,
  },
  customers: {
    customerId: 0, name: 1, email: 2, age: 3, gender: 4,
    location: 5, acquisitionChannel: 6, firstPurchaseDate: 7, lifetimeValue: 8,
  },
};

// Canonical branch list (also derived at runtime from the Locations sheet).
export const LOCATIONS = ['New York', 'London', 'Dubai', 'Singapore'];

export const SALES_CHANNELS = ['Website', 'Walk-in', 'Referral', 'Partner', 'Social Media'];
export const PAYMENT_TYPES = ['Cash', 'Financing', 'Lease Trade', 'Trade-in + Cash'];
export const BODY_TYPES = ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Truck', 'Van'];
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
export const CONDITIONS = ['Excellent', 'Very Good', 'Good', 'Fair'];

// Inventory age buckets (days listed).
export const AGE_BUCKETS = [
  { key: 'fresh',    label: '0–30d',    min: 0,   max: 30,  color: '#22c55e' },
  { key: 'normal',   label: '31–60d',   min: 31,  max: 60,  color: '#3b82f6' },
  { key: 'watch',    label: '61–90d',   min: 61,  max: 90,  color: '#f59e0b' },
  { key: 'aging',    label: '91–120d',  min: 91,  max: 120, color: '#f97316' },
  { key: 'stale',    label: '120d+',    min: 121, max: Infinity, color: '#ef4444' },
];

// Chart colour palette — brand-neutral, works in light + dark.
export const CHART_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#10b981', '#f97316', '#6366f1',
];

// Storage keys — namespaced with "ag_" so a first-boot migration can wipe
// old cost-dashboard keys without stomping unrelated localStorage.
export const STORAGE_KEYS = {
  workbook: 'ag_workbook',
  categories: 'ag_categories',
  cacheId: 'ag_cache_id',
  anglesPrefix: 'ag_angles_v1_',
  schemaVersion: 'ag_schema_version',
};

// Bumped whenever the persisted shape changes. On mismatch we clear ag_* keys.
export const SCHEMA_VERSION = 1;

// Legacy keys wiped on first boot of the new app so a returning user with an
// old BOM-era cache doesn't crash the new parsers.
export const LEGACY_KEYS = [
  'costData', 'aiCategories', 'aiCategoryData', 'currentCacheId',
];
