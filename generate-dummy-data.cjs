/**
 * Generates a dummy Excel file matching the "GIVEN DATA SHEET" format
 * expected by the dashboard upload (5 header rows, data from row 6).
 * Run: node generate-dummy-data.js
 */
const XLSX = require('xlsx');

// --- Header rows (rows 1-5) ---
const headerRow1 = ['GIVEN DATA SHEET', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
const headerRow2 = ['Sales Register', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Actual Cost', '', '', '', '', 'Budget', '', '', '', ''];
const headerRow3 = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'RM LBP', 'RM MAP', 'OS', '', 'RM', 'OS', 'Qty', '', 'Qty'];
const headerRow4 = ['Sl.no', 'Project', 'Month', 'Invoice Qty', 'Unit Price', 'Invoice Value (INR)', 'Customer', 'Date', 'Destination', 'Part No', 'FG Part Code', 'FG Part No', 'Sales Order', 'Customs PO', 'Ex. Rate', 'OBD No', 'Invoice No', 'Invoice Date', 'Invoice Value (USD)', 'Currency', '', 'RM LBP /unit', 'RM MAP /unit', 'OS /unit', '', 'RM Budget /unit', 'OS Budget /unit', 'Budgeted Qty', '', 'Projected Qty'];
const headerRow5 = ['', '', '', '', '(USD)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '(INR)', '(INR)', '(INR)', '', '(INR)', '(INR)', '', '', ''];

// --- Sample data ---
const projects = ['Project Alpha', 'Project Beta', 'Project Gamma', 'Project Delta'];
const months = ['April25', 'May25', 'June25', 'July25', 'Aug25', 'Sept25'];
const customers = ['Toyota Motor Corp', 'Honda Industries', 'Suzuki Auto Parts', 'Hyundai Mobis', 'Bosch Ltd'];
const destinations = ['Chennai', 'Pune', 'Manesar', 'Sanand', 'Pantnagar'];
const currencies = ['USD', 'USD', 'USD', 'EURO'];

const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];

// Excel date serial for a date in 2025
const excelDate = (month, day) => {
  const d = new Date(2025, month, day);
  return Math.round((d.getTime() / 86400000) + 25569);
};

const dataRows = [];
let serial = 1;

for (let i = 0; i < 60; i++) {
  const project = pick(projects);
  const month = pick(months);
  const monthIdx = months.indexOf(month);
  const qty = randInt(50, 500);
  const unitPrice = rand(8, 45);
  const exRate = rand(83, 93);
  const invoiceINR = Math.round(qty * unitPrice * exRate);
  const invoiceUSD = Math.round(qty * unitPrice * 100) / 100;
  const customer = pick(customers);
  const destination = pick(destinations);
  const partNo = `PN-${randInt(1000, 9999)}`;
  const fgPartShort = String(randInt(10, 99));
  const fgPart = String(randInt(1000000000, 9999999999));
  const salesOrder = `SO-${randInt(10000, 99999)}`;
  const customsPO = `PO-${randInt(1000, 9999)}`;
  const obd = `OBD-${randInt(100, 999)}`;
  const invoiceNo = `INV-${randInt(10000, 99999)}`;
  const currency = pick(currencies);

  // Per-unit costs (INR)
  const rmLbp = rand(50, 300);
  const rmMap = rand(40, 250);
  const os = rand(20, 150);
  const rmBudget = rand(45, 260);
  const osBudget = rand(18, 140);
  const qtyBudget = randInt(40, 550);
  const qtyProjected = randInt(60, 600);

  const day = randInt(1, 28);
  const dateSerial = excelDate(monthIdx + 3, day); // April=3 in JS months
  const invoiceDateSerial = excelDate(monthIdx + 3, Math.min(day + 2, 28));

  // Build row array with 31 columns (A through AE = index 0-30)
  const row = new Array(31).fill('');
  row[0] = serial;           // A - Sl.no
  row[1] = project;          // B - Project
  row[2] = month;            // C - Month
  row[3] = qty;              // D - Invoice Qty
  row[4] = unitPrice;        // E - Unit Price (USD)
  row[5] = invoiceINR;       // F - Invoice Value INR
  row[6] = customer;         // G - Customer
  row[7] = dateSerial;       // H - Date (Excel serial)
  row[8] = destination;      // I - Destination
  row[9] = partNo;           // J - Part No
  row[10] = fgPartShort;     // K - FG Part Code
  row[11] = fgPart;          // L - FG Part No
  row[12] = salesOrder;      // M - Sales Order
  row[13] = customsPO;       // N - Customs PO
  row[14] = exRate;          // O - Ex. Rate
  row[15] = obd;             // P - OBD No
  row[16] = invoiceNo;       // Q - Invoice No
  row[17] = invoiceDateSerial; // R - Invoice Date
  row[18] = invoiceUSD;      // S - Invoice Value USD
  row[19] = currency;        // T - Currency
  // U (20), V (21) — empty
  row[22] = rmLbp;           // W - RM LBP /unit
  row[23] = rmMap;           // X - RM MAP /unit
  row[24] = os;              // Y - OS /unit
  // Z (25) — empty
  row[26] = rmBudget;        // AA - RM Budget /unit
  row[27] = osBudget;        // AB - OS Budget /unit
  row[28] = qtyBudget;       // AC - Budgeted Qty
  // AD (29) — empty
  row[30] = qtyProjected;    // AE - Projected Qty

  dataRows.push(row);
  serial++;
}

// --- Build worksheet ---
const wsData = [headerRow1, headerRow2, headerRow3, headerRow4, headerRow5, ...dataRows];
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths for readability
ws['!cols'] = [
  { wch: 6 },  // A
  { wch: 14 }, // B
  { wch: 10 }, // C
  { wch: 12 }, // D
  { wch: 10 }, // E
  { wch: 16 }, // F
  { wch: 18 }, // G
  { wch: 10 }, // H
  { wch: 12 }, // I
  { wch: 12 }, // J
  { wch: 12 }, // K
  { wch: 14 }, // L
  { wch: 12 }, // M
  { wch: 12 }, // N
  { wch: 8 },  // O
  { wch: 10 }, // P
  { wch: 12 }, // Q
  { wch: 10 }, // R
  { wch: 16 }, // S
  { wch: 8 },  // T
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'GIVEN DATA');

const outPath = './dummy_sales_data.xlsx';
XLSX.writeFile(wb, outPath);
console.log(`✅ Dummy Excel file created: ${outPath}`);
console.log(`   ${dataRows.length} data rows | 5 header rows | Columns A–AE`);
