const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_FILE = path.join(__dirname, '..', 'data', 'rsvp-data.json');
const CSV_FILE = 'C:/Users/mhc62/Desktop/RSVP_Cadmus_Matteo_GuestList.csv';

const kids = [
  'Tony Tony Chopper', 'Kozuki Momonosuke', 'Otama', 'Otoko', 'Chimney',
  'Gonbe', 'Carrot', 'Kuina', 'Helmeppo', 'Kaya',
  'Ninjin', 'Piiman', 'Tamanegi', 'Apis', 'Leo (Tontatta)',
  'Mansherry (Tontatta)', 'Wicca (Tontatta)', 'Flapper (Tontatta)', 'Bian (Tontatta)', 'Kabu (Tontatta)',
  'Bartolomeo', 'Cavendish', 'Baby 5', 'Dellinger', 'Sugar',
  'Buffalo', 'Monet', 'Charlotte Pudding', 'Charlotte Flampe', 'Charlotte Anana',
  'Charlotte Dolce', 'Charlotte Dragee', 'Charlotte Anglais', 'Charlotte Wafers', 'Charlotte Normande',
  'Stelly', 'Koala', 'Princess Shirahoshi', 'Fukaboshi'
];

const adults = [
  'Nami', 'Usopp', 'Franky (Cutty Flam)', 'Jinbe', 'Nefertari Vivi',
  'Nefertari Cobra', 'Pell', 'Chaka', 'Igaram', 'Karoo',
  'Zeff', 'Patty', 'Carne', 'Gin', 'Don Krieg',
  'Captain Kuro', 'Jango', 'Sham', 'Buchi', 'Morgan (Axe-Hand Morgan)',
  'Buggy the Clown', 'Mohji', 'Cabaji', 'Alvida', 'Gaimon',
  'Crocus', 'Laboon', 'Dorry the Blue Ogre', 'Brogy the Red Ogre', 'Dr. Kureha',
  'Dr. Hiriluk', 'Dalton', 'Wapol', 'Chess', 'Kuromarimo',
  'Sir Crocodile', 'Daz Bonez (Mr. 1)', 'Zala (Miss Doublefinger)', 'Galdino (Mr. 3)', 'Marianne (Miss Goldenweek)',
  'Mr. 4', 'Miss Merry Christmas', 'Mr. 5', 'Miss Valentine', 'Mr. 7',
  'Miss Father\'s Day', 'Mr. 8', 'Miss Monday', 'Mr. 9', 'Miss Wednesday',
  'Donquixote Doflamingo', 'Donquixote Rosinante (Corazon)', 'Trebol', 'Diamante', 'Pica',
  'Senor Pink', 'Lao G', 'Machvise', 'Gladius', 'Jora',
  'Kyros (Soldier-san)', 'King Riku Doldo III', 'Viola (Violet)', 'Tank Lepanto', 'Don Sai',
  'Boo', 'Don Chinjao', 'Hajrudin', 'Ideo', 'Blue Gilly',
  'Orlumbus', 'Suleiman', 'Abdullah', 'Jeet', 'King Elizabello II',
  'Dagama', 'Ricky', 'Edward Newgate (Whitebeard)', 'Marco the Phoenix', 'Jozu',
  'Vista', 'Thatch', 'Blenheim', 'Curiel', 'Kingdew',
  'Haruta', 'Atmos', 'Speed Jil', 'Fossa', 'Izo',
  'Namur', 'Blamenco', 'Rakuyo', 'Marshall D. Teach (Blackbeard)', 'Jesus Burgess',
  'Shiryu of the Rain', 'Van Augur', 'Avalo Pizarro', 'Catarina Devon', 'Vasco Shot',
  'Sanjuan Wolf', 'Doc Q', 'Stronger', 'Kaido', 'King the Conflagration',
  'Queen the Plague', 'Jack the Drought', 'Who\'s-Who', 'Sasaki', 'Black Maria',
  'Ulti', 'Page One', 'Holdem', 'Speed', 'Dobon',
  'Babanuki', 'Daifugo', 'Solitaire', 'Charlotte Linlin (Big Mom)', 'Charlotte Perospero',
  'Charlotte Daifuku', 'Charlotte Oven', 'Charlotte Cracker', 'Charlotte Smoothie', 'Charlotte Mont-d\'Or',
  'Charlotte Opera', 'Charlotte Brulee', 'Charlotte Galette', 'Charlotte Amande', 'Charlotte Snack',
  'Baron Tamago', 'Pekoms', 'Bobbin', 'Kozuki Sukiyaki (Tenguyama Hitetsu)', 'Kozuki Toki',
  'Kin\'emon', 'Denjiro (Kyoshiro)', 'Kikunojo (O-Kiku)', 'Raizo', 'Ashura Doji (Shutenmaru)',
  'Kawamatsu', 'Inuarashi (Duke Inuarashi)', 'Nekomamushi (Master Nekomamushi)', 'Shinobu', 'Hyogoro of the Flower',
  'Shimotsuki Yasuie (Tonoyasu)', 'Shimotsuki Ushimaru', 'Kurozumi Orochi', 'Kurozumi Kanjuro', 'Kurozumi Higurashi',
  'Kurozumi Semimaru', 'Red-Haired Shanks', 'Benn Beckman', 'Lucky Roux', 'Yasopp',
  'Limejuice', 'Bonk Punch', 'Monster', 'Building Snake', 'Hongo'
];

let localData = { event: {}, guests: [] };
if (fs.existsSync(DATA_FILE)) {
  localData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

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

// Add Kids
kids.forEach(name => {
  const code = generateTicketCode();
  const id = 'cm_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  localData.guests.push({
    id,
    ticketCode: code,
    name: name,
    guestList: `${name} (Kid)`,
    contact: '',
    email: '',
    status: 'Attending',
    seats: 1,
    dietary: '',
    wishes: "Happy 7th Birthday, Captain Cadmus Matteo! 🍖🎂🏴‍☠️",
    tableNumber: '',
    checkedIn: true,
    checkedInAt: nowIso,
    registeredAt: nowIso
  });
});

// Add Adults
adults.forEach(name => {
  const code = generateTicketCode();
  const id = 'cm_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  localData.guests.push({
    id,
    ticketCode: code,
    name: name,
    guestList: `${name} (Adult)`,
    contact: '',
    email: '',
    status: 'Attending',
    seats: 1,
    dietary: '',
    wishes: "Happy 7th Birthday, Captain Cadmus Matteo! Welcome to the Grand Line! 🏴‍☠️",
    tableNumber: '',
    checkedIn: true,
    checkedInAt: nowIso,
    registeredAt: nowIso
  });
});

localData.lastUpdated = nowIso;

// Verification
let totalKids = 0;
let totalAdults = 0;
localData.guests.forEach(g => {
  const gl = (g.guestList || '').toLowerCase();
  if (gl.includes('(kid)') || gl.includes('kid')) {
    totalKids++;
  } else {
    totalAdults++;
  }
});

console.log(`\n================ STATS VERIFICATION ================`);
console.log(`Total Guests : ${localData.guests.length} (Target: 287)`);
console.log(`Total Kids   : ${totalKids} (Target: 72)`);
console.log(`Total Adults : ${totalAdults} (Target: 215)`);
console.log(`====================================================\n`);

if (localData.guests.length !== 287 || totalKids !== 72 || totalAdults !== 215) {
  console.error('❌ Mismatch in target numbers! Aborting save.');
  process.exit(1);
}

fs.writeFileSync(DATA_FILE, JSON.stringify(localData, null, 2), 'utf8');
console.log(`✅ Saved data to: ${DATA_FILE}`);

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
console.log('\nSyncing all 287 guests to Render Cloud (https://rsvp-cadmus-matteo.onrender.com/api/sync)...');
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
