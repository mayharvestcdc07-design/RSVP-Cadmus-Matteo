const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_FILE = path.join(__dirname, '..', 'data', 'rsvp-data.json');
const CSV_FILE = 'C:/Users/mhc62/Desktop/RSVP_Cadmus_Matteo_GuestList.csv';

const rawList = [
  { name: 'Conis', type: 'Adult' },
  { name: 'Pagaya', type: 'Kid' },
  { name: 'Aisa', type: 'Kid' },
  { name: 'Wyper', type: 'Kid' },
  { name: 'Kamakiri', type: 'Adult' },
  { name: 'Braham', type: 'Adult' },
  { name: 'Genbo', type: 'Kid' },
  { name: 'Raki', type: 'Kid' },
  { name: 'Shura', type: 'Adult' },
  { name: 'Ohm', type: 'Adult' },
  { name: 'Gedatsu', type: 'Kid' },
  { name: 'Satori', type: 'Kid' },
  { name: 'Hotori', type: 'Adult' },
  { name: 'Kotori', type: 'Kid' },
  { name: 'Mont Blanc Noland', type: 'Adult' },
  { name: 'Kalgara', type: 'Kid' },
  { name: 'Mont Blanc Cricket', type: 'Adult' },
  { name: 'Bellamy', type: 'Kid' },
  { name: 'Sarquiss', type: 'Kid' },
  { name: 'Gecko Moria', type: 'Adult' },
  { name: 'Perona', type: 'Adult' },
  { name: 'Absalom', type: 'Kid' },
  { name: 'Dr. Hogback', type: 'Kid' },
  { name: 'Cindry', type: 'Adult' },
  { name: 'Ryuma', type: 'Kid' },
  { name: 'Kumashi', type: 'Adult' },
  { name: 'Tararan', type: 'Kid' },
  { name: 'Victoria Cindry', type: 'Adult' },
  { name: 'Bartholomew Kuma', type: 'Adult' },
  { name: 'Brook', type: 'Kid' },
  { name: 'Cerberus', type: 'Adult' },
  { name: 'Hildon', type: 'Kid' },
  { name: 'Silvers Rayleigh', type: 'Adult' },
  { name: 'Shakuyaku (Shakky)', type: 'Adult' },
  { name: 'Camie', type: 'Adult' },
  { name: 'Pappag', type: 'Kid' },
  { name: 'Duval', type: 'Kid' },
  { name: 'Eustass Kid', type: 'Adult' },
  { name: 'Killer', type: 'Kid' },
  { name: 'Trafalgar D. Water Law', type: 'Adult' },
  { name: 'Bepo', type: 'Kid' },
  { name: 'Jean Bart', type: 'Adult' },
  { name: 'X Drake', type: 'Kid' },
  { name: 'Basil Hawkins', type: 'Adult' },
  { name: 'Scratchmen Apoo', type: 'Kid' },
  { name: 'Capone Bege', type: 'Kid' },
  { name: 'Urouge', type: 'Kid' },
  { name: 'Jewelry Bonney', type: 'Adult' },
  { name: 'Kizaru (Borsalino)', type: 'Kid' },
  { name: 'Sentomaru', type: 'Kid' },
  { name: 'Boa Hancock', type: 'Kid' }
];

let localData = { event: {}, guests: [] };
if (fs.existsSync(DATA_FILE)) {
  localData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Build map of existing guests by normalized name
const existingMap = new Map();
localData.guests.forEach(g => {
  existingMap.set(g.name.trim().toLowerCase(), g);
  // Also check ticket code
  if (g.ticketCode) existingMap.set(g.ticketCode.trim().toUpperCase(), g);
});

// Used ticket codes set
const usedCodes = new Set(localData.guests.map(g => g.ticketCode));

function generateTicketCode() {
  while (true) {
    const code = 'CM-' + Math.floor(100000 + Math.random() * 900000);
    if (!usedCodes.has(code)) {
      usedCodes.add(code);
      return code;
    }
  }
}

const nowIso = new Date().toISOString();
let addedCount = 0;
let updatedCount = 0;

rawList.forEach(item => {
  const norm = item.name.trim().toLowerCase();
  
  // Check variations (e.g. Borsalino vs Kizaru)
  let existing = existingMap.get(norm);
  if (!existing) {
    if (norm.includes('borsalino') || norm.includes('kizaru')) {
      existing = localData.guests.find(g => g.name.toLowerCase().includes('borsalino') || g.name.toLowerCase().includes('kizaru'));
    } else if (norm.includes('hogba')) {
      existing = localData.guests.find(g => g.name.toLowerCase().includes('hogba'));
    }
  }

  if (existing) {
    // Update existing record
    existing.guestList = `${item.name} (${item.type})`;
    existing.seats = 1;
    existing.checkedIn = true;
    if (!existing.checkedInAt) existing.checkedInAt = nowIso;
    updatedCount++;
    console.log(`Updated existing guest: ${existing.name} -> ${item.name} (${item.type})`);
  } else {
    // Add new guest
    const ticketCode = generateTicketCode();
    const id = 'cm_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newGuest = {
      id,
      ticketCode,
      name: item.name,
      guestList: `${item.name} (${item.type})`,
      contact: '',
      email: '',
      status: 'Attending',
      seats: 1,
      dietary: '',
      wishes: "Happy 7th Birthday, Captain Cadmus Matteo! 🏴‍☠️",
      tableNumber: '',
      checkedIn: true,
      checkedInAt: nowIso,
      registeredAt: nowIso
    };
    localData.guests.push(newGuest);
    existingMap.set(norm, newGuest);
    addedCount++;
    console.log(`Added new guest: ${item.name} (${item.type}) - ${ticketCode}`);
  }
});

localData.lastUpdated = nowIso;
fs.writeFileSync(DATA_FILE, JSON.stringify(localData, null, 2), 'utf8');
console.log(`\n✅ Finished updating local database: ${addedCount} added, ${updatedCount} updated. Total guests: ${localData.guests.length}`);

// Update Desktop CSV if exists
if (fs.existsSync(CSV_FILE)) {
  const csvRows = [
    ['Ticket Code', 'Name', 'Status', 'Seats', 'Table #', 'Checked In', 'Checked-In Time', 'Contact', 'Email', 'Dietary Requirements', 'Wishes / Message', 'RSVP Date']
  ];
  localData.guests.forEach(g => {
    csvRows.push([
      g.ticketCode || '',
      g.name || '',
      g.status || 'Attending',
      g.seats || 1,
      g.tableNumber || '',
      g.checkedIn ? 'YES' : 'NO',
      g.checkedInAt ? new Date(g.checkedInAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' }) : '',
      g.contact || '',
      g.email || '',
      g.dietary || '',
      g.wishes || '',
      g.registeredAt ? new Date(g.registeredAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' }) : ''
    ]);
  });
  const csvContent = '\ufeff' + csvRows.map(row => 
    row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')
  ).join('\r\n');
  fs.writeFileSync(CSV_FILE, csvContent, 'utf8');
  console.log(`✅ Desktop CSV updated: ${CSV_FILE}`);
}

// Push to Render Cloud
console.log('\nSyncing with Render Cloud...');
const payload = JSON.stringify({
  guests: localData.guests,
  event: localData.event
});

const req = https.request('https://rsvp-cadmus-matteo.onrender.com/api/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Render sync status: ${res.statusCode}`);
    console.log(`Render sync response: ${body}`);
  });
});

req.on('error', (err) => {
  console.error('Render sync network error:', err.message);
});

req.write(payload);
req.end();
