const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_FILE = path.join(__dirname, '..', 'data', 'rsvp-data.json');
const CSV_FILE = 'C:/Users/mhc62/Desktop/RSVP_Cadmus_Matteo_GuestList.csv';

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

let kidsCount = 0;
let adultsCount = 0;

data.guests.forEach(g => {
  const gl = (g.guestList || '').toLowerCase();
  if (gl.includes('(kid)') || gl.includes('kid')) {
    g.guestType = 'Kid';
    kidsCount++;
  } else {
    g.guestType = 'Adult';
    adultsCount++;
  }
});

console.log('Updated guestType on guests:', { total: data.guests.length, kids: kidsCount, adults: adultsCount });

data.lastUpdated = new Date().toISOString();
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

// Update CSV
const headers = [
  'Ticket Code',
  'Name',
  'Type (Adult / Kid)',
  'Crew Details',
  'Status',
  'Seats',
  'Table #',
  'Checked In',
  'Checked-In Time',
  'Contact',
  'Email',
  'Dietary Requirements',
  'Wishes / Message',
  'RSVP Date'
];
const csvRows = [headers];

data.guests.forEach(g => {
  csvRows.push([
    g.ticketCode || '',
    g.name || '',
    g.guestType,
    g.guestList || '',
    g.status || 'Attending',
    g.seats || 1,
    g.tableNumber || '',
    g.checkedIn ? 'YES' : 'NO',
    g.checkedInAt ? new Date(g.checkedInAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' }) : '',
    g.contact || '',
    g.email || '',
    g.dietary || '',
    (g.wishes || '').replace(/\r?\n/g, ' '),
    g.registeredAt ? new Date(g.registeredAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' }) : ''
  ]);
});

const csvContent = '\ufeff' + csvRows.map(row => 
  row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')
).join('\r\n');

fs.writeFileSync(CSV_FILE, csvContent, 'utf8');
console.log('✅ CSV written to desktop with Type column!');

// Sync to Render
console.log('Syncing to Render Cloud...');
const payload = JSON.stringify({ guests: data.guests, event: data.event });
const req = https.request('https://rsvp-cadmus-matteo.onrender.com/api/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log('Render sync:', res.statusCode, b));
});
req.on('error', e => console.error('Render error:', e.message));
req.write(payload);
req.end();
