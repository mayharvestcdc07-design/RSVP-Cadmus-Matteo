const fs = require('fs');
const path = require('path');

const CSV_PATH = 'C:/Users/mhc62/Desktop/RSVP_Cadmus_Matteo_GuestList.csv';
const DATA_FILE = path.join(__dirname, '..', 'data', 'rsvp-data.json');

function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], cur = '', inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cur.trim());
      cur = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur || row.length) {
    row.push(cur.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

function parseDateToIso(str) {
  if (!str) return null;
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString();
  return null;
}

const csvText = fs.readFileSync(CSV_PATH, 'utf8');
const rows = parseCSV(csvText);
const headers = rows[0];
console.log('Headers:', headers);

let localData = { event: {}, guests: [] };
if (fs.existsSync(DATA_FILE)) {
  localData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

const existingGuestMap = new Map();
(localData.guests || []).forEach(g => {
  if (g.ticketCode) existingGuestMap.set(g.ticketCode, g);
  if (g.id) existingGuestMap.set(g.id, g);
});

const importedGuests = [];

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[0]) continue;
  
  const ticketCode = r[0].trim();
  const name = r[1] ? r[1].trim() : 'Guest';
  const status = r[2] ? r[2].trim() : 'Attending';
  const seats = parseInt(r[3], 10) || 1;
  const tableNumber = r[4] ? r[4].trim() : '';
  const isCheckedIn = (r[5] || '').toUpperCase() === 'YES' || (r[5] || '').toLowerCase() === 'true';
  const checkedInAt = parseDateToIso(r[6]) || (isCheckedIn ? new Date().toISOString() : null);
  const contact = r[7] ? r[7].trim() : '';
  const email = r[8] ? r[8].trim() : '';
  const dietary = r[9] ? r[9].trim() : '';
  const wishes = r[10] ? r[10].trim() : '';
  const registeredAt = parseDateToIso(r[11]) || new Date().toISOString();

  // Check if we have an existing record by ticketCode to preserve the original ID and guestList
  const existing = existingGuestMap.get(ticketCode);
  const id = existing && existing.id ? existing.id : ('cm_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5));
  const guestList = existing && existing.guestList ? existing.guestList : (name + (seats > 1 ? ` (+${seats - 1} guests)` : ' (Adult)'));

  const guestObj = {
    id,
    ticketCode,
    name,
    guestList,
    contact,
    email,
    status,
    seats,
    dietary,
    wishes,
    tableNumber,
    checkedIn: isCheckedIn,
    checkedInAt,
    registeredAt
  };

  importedGuests.push(guestObj);
}

console.log(`Parsed ${importedGuests.length} guests from CSV.`);
console.log('Sample parsed guest:', importedGuests[0]);

localData.guests = importedGuests;
localData.lastUpdated = new Date().toISOString();

fs.writeFileSync(DATA_FILE, JSON.stringify(localData, null, 2), 'utf8');
console.log(`✅ Saved ${importedGuests.length} guests to ${DATA_FILE}`);
