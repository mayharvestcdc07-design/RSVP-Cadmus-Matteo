const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'rsvp-data.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial state with default event details for Cadmus Matteo
const freshState = () => ({
  event: {
    title: "Cadmus Matteo's 7th Birthday",
    subtitle: "One Piece Grand Line Adventure — 7 Years & 7 Million Berries! 🏴‍☠️",
    eventDate: "2026-11-30",
    eventTime: "15:00",
    venueName: "Grace Harbour Pavillion",
    venueAddress: "544 Gov Fortunato Halili Ave, Santa Maria, 3022 Bulacan",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=544+Gov+Fortunato+Halili+Ave+Santa+Maria+3022+Bulacan",
    contactPerson: "The Cortes Family",
    contactNumber: "+63 917 123 4567",
    welcomeNote: "The crew is gathering. The treasure is cake. The adventure is turning seven! See you on the Grand Line, nakama! 🏴‍☠️",
    adminPin: "2026"
  },
  guests: [],
  lastUpdated: new Date().toISOString()
});

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(content);
      return {
        event: Object.assign(freshState().event, parsed.event || {}),
        guests: Array.isArray(parsed.guests) ? parsed.guests : [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString()
      };
    }
  } catch (err) {
    console.error('[RSVP Server] Error reading data file:', err);
  }
  const init = freshState();
  saveData(init);
  return init;
}

function saveData(data) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[RSVP Server] Error writing data file:', err);
  }
}

// Ensure file is loaded once on boot
loadData();

// Optional Cloud Database Connection (Neon / Supabase PostgreSQL)
let pgPool = null;
if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log('[RSVP Server] DATABASE_URL detected: Initializing Cloud PostgreSQL connection...');

    pgPool.query(`
      CREATE TABLE IF NOT EXISTS rsvp_guests (
        id TEXT PRIMARY KEY,
        ticket_code TEXT,
        name TEXT,
        guest_list TEXT,
        contact TEXT,
        email TEXT,
        status TEXT,
        seats INT,
        dietary TEXT,
        wishes TEXT,
        table_number TEXT,
        checked_in BOOLEAN,
        checked_in_at TIMESTAMPTZ,
        registered_at TIMESTAMPTZ
      );
    `).then(async () => {
      const countRes = await pgPool.query('SELECT count(*) FROM rsvp_guests');
      const count = parseInt(countRes.rows[0].count, 10);
      if (count === 0) {
        const local = loadData();
        for (const g of local.guests) {
          await pgPool.query(
            `INSERT INTO rsvp_guests (id, ticket_code, name, guest_list, contact, email, status, seats, dietary, wishes, table_number, checked_in, checked_in_at, registered_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING`,
            [g.id, g.ticketCode, g.name, g.guestList, g.contact, g.email, g.status, g.seats, g.dietary, g.wishes, g.tableNumber, g.checkedIn, g.checkedInAt, g.registeredAt]
          );
        }
        console.log(`[RSVP Server] Cloud Database initialized and seeded with ${local.guests.length} guests!`);
      } else {
        const cloudRes = await pgPool.query('SELECT * FROM rsvp_guests ORDER BY registered_at DESC');
        const local = loadData();
        local.guests = cloudRes.rows.map(r => ({
          id: r.id,
          ticketCode: r.ticket_code,
          name: r.name,
          guestList: r.guest_list,
          contact: r.contact,
          email: r.email,
          status: r.status,
          seats: r.seats,
          dietary: r.dietary,
          wishes: r.wishes,
          tableNumber: r.table_number,
          checkedIn: r.checked_in,
          checkedInAt: r.checked_in_at,
          registeredAt: r.registered_at
        }));
        saveData(local);
        console.log(`[RSVP Server] Successfully synced ${cloudRes.rows.length} guests from Cloud PostgreSQL into local storage!`);
      }
    }).catch(err => {
      console.error('[RSVP Server] Cloud PostgreSQL init error:', err.message);
    });
  } catch (err) {
    console.error('[RSVP Server] Failed to initialize PostgreSQL pool:', err.message);
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check for Render
  if (pathname === '/healthz' || pathname === '/health') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'RSVP Cadmus Matteo',
      uptime: process.uptime(),
      time: new Date().toISOString()
    });
  }

  // API 1: Event Details
  if (pathname === '/api/event') {
    const data = loadData();
    if (req.method === 'GET') {
      const publicEvent = { ...data.event };
      delete publicEvent.adminPin; // hide PIN from public API
      return sendJson(res, 200, { success: true, event: publicEvent });
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        if (body.pin !== data.event.adminPin) {
          return sendJson(res, 401, { error: 'Unauthorized: Invalid Admin PIN' });
        }
        data.event = { ...data.event, ...body.event };
        if (body.newPin) data.event.adminPin = String(body.newPin);
        saveData(data);
        return sendJson(res, 200, { success: true, event: data.event });
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }
    }
  }

  // API 2: Verify Admin PIN
  if (pathname === '/api/admin/verify' && req.method === 'POST') {
    const body = await parseBody(req);
    const data = loadData();
    const isValid = String(body.pin || '').trim() === String(data.event.adminPin || '2026').trim();
    return sendJson(res, 200, { valid: isValid });
  }

  // API 3: Guests & Stats
  if (pathname === '/api/guests') {
    const data = loadData();
    if (req.method === 'GET') {
      const total = data.guests.length;
      const attending = data.guests.filter(g => g.status === 'Attending');
      const declined = data.guests.filter(g => g.status === 'Declined');
      const totalSeats = attending.reduce((acc, g) => acc + (Number(g.seats) || 1), 0);
      const checkedIn = attending.filter(g => g.checkedIn).length;
      const checkedInSeats = attending.filter(g => g.checkedIn).reduce((acc, g) => acc + (Number(g.seats) || 1), 0);

      return sendJson(res, 200, {
        success: true,
        stats: {
          totalGuests: total,
          attendingCount: attending.length,
          declinedCount: declined.length,
          totalSeats: totalSeats,
          checkedInCount: checkedIn,
          checkedInSeats: checkedInSeats
        },
        guests: data.guests
      });
    }
  }

  // API 4: RSVP Submission (Public)
  if (pathname === '/api/rsvp' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      let mainName = String(body.name || '').trim();
      let guestList = Array.isArray(body.guests) ? body.guests : [];
      if (!mainName && guestList.length > 0) {
        mainName = guestList[0].name;
      }
      if (!mainName && body.status !== 'Declined') {
        return sendJson(res, 400, { error: 'Name is required.' });
      }

      const data = loadData();
      const code = 'CM-' + Math.floor(100000 + Math.random() * 900000);
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const seatsCount = body.status === 'Declined' ? 0 : (guestList.length > 0 ? guestList.length : Math.max(1, parseInt(body.seats, 10) || 1));
      const guestDetails = guestList.length > 0 ? guestList.map(g => `${g.name} (${g.type || 'Adult'})`).join(', ') : '';

      const guest = {
        id,
        ticketCode: code,
        name: mainName || 'Unnamed Guest',
        guestList: guestDetails,
        contact: String(body.contact || '').trim(),
        email: String(body.email || '').trim(),
        status: body.status === 'Declined' ? 'Declined' : 'Attending',
        seats: seatsCount,
        dietary: String(body.dietary || '').trim(),
        wishes: String(body.wishes || body.message || '').trim(),
        tableNumber: '',
        checkedIn: body.status !== 'Declined',
        checkedInAt: body.status !== 'Declined' ? new Date().toISOString() : null,
        registeredAt: new Date().toISOString()
      };

      data.guests.unshift(guest);
      saveData(data);

      if (pgPool) {
        pgPool.query(
          `INSERT INTO rsvp_guests (id, ticket_code, name, guest_list, contact, email, status, seats, dietary, wishes, table_number, checked_in, checked_in_at, registered_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             guest_list = EXCLUDED.guest_list,
             status = EXCLUDED.status,
             seats = EXCLUDED.seats,
             wishes = EXCLUDED.wishes,
             table_number = EXCLUDED.table_number,
             checked_in = EXCLUDED.checked_in`,
          [guest.id, guest.ticketCode, guest.name, guest.guestList, guest.contact, guest.email, guest.status, guest.seats, guest.dietary, guest.wishes, guest.tableNumber, guest.checkedIn, guest.checkedInAt, guest.registeredAt]
        ).catch(err => console.error('[RSVP Server] PG insert error:', err.message));
      }

      return sendJson(res, 201, { success: true, guest });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // API 5: Check-in Scanner API (By Ticket Code or ID)
  if (pathname === '/api/check-in' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const query = String(body.query || '').trim().toUpperCase();
      if (!query) {
        return sendJson(res, 400, { error: 'Ticket Code or Guest ID is required.' });
      }

      const data = loadData();
      const guest = data.guests.find(g => 
        (g.ticketCode && g.ticketCode.toUpperCase() === query) ||
        (g.id && g.id.toUpperCase() === query)
      );

      if (!guest) {
        return sendJson(res, 404, { success: false, error: 'Ticket not found. Please verify the code.' });
      }

      if (guest.status === 'Declined') {
        return sendJson(res, 400, { success: false, error: 'This guest had previously declined the RSVP.' });
      }

      if (guest.checkedIn) {
        return sendJson(res, 200, {
          success: true,
          alreadyCheckedIn: true,
          message: `Already checked in at ${new Date(guest.checkedInAt).toLocaleTimeString()}`,
          guest
        });
      }

      guest.checkedIn = true;
      guest.checkedInAt = new Date().toISOString();
      saveData(data);

      return sendJson(res, 200, {
        success: true,
        alreadyCheckedIn: false,
        message: 'Guest successfully checked in!',
        guest
      });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // API 6: Guest Update (Admin)
  if (pathname.startsWith('/api/guests/') && req.method === 'PUT') {
    try {
      const id = pathname.replace('/api/guests/', '');
      const body = await parseBody(req);
      const data = loadData();
      const idx = data.guests.findIndex(g => g.id === id);
      if (idx === -1) {
        return sendJson(res, 404, { error: 'Guest not found' });
      }

      data.guests[idx] = { ...data.guests[idx], ...body };
      saveData(data);
      if (pgPool) {
        pgPool.query('UPDATE rsvp_guests SET table_number = $1, checked_in = $2 WHERE id = $3', 
          [data.guests[idx].tableNumber || '', !!data.guests[idx].checkedIn, id]
        ).catch(err => console.error('[RSVP Server] PG update error:', err.message));
      }
      return sendJson(res, 200, { success: true, guest: data.guests[idx] });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // API 7: Delete Guest (Admin)
  if (pathname.startsWith('/api/guests/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/guests/', '');
    const data = loadData();
    const initialLen = data.guests.length;
    data.guests = data.guests.filter(g => g.id !== id);
    if (data.guests.length !== initialLen) {
      saveData(data);
      if (pgPool) {
        pgPool.query('DELETE FROM rsvp_guests WHERE id = $1', [id]).catch(err => console.error('[RSVP Server] PG delete error:', err.message));
      }
      return sendJson(res, 200, { success: true, message: 'Guest deleted' });
    }
    return sendJson(res, 404, { error: 'Guest not found' });
  }

  // API 8: CSV Export
  if (pathname === '/api/export' && req.method === 'GET') {
    const data = loadData();
    const headers = ['Ticket Code', 'Name', 'Status', 'Seats', 'Table #', 'Checked In', 'Checked-In Time', 'Contact', 'Email', 'Dietary Requirements', 'Wishes / Message', 'RSVP Date'];
    const csvRows = [headers];

    data.guests.forEach(g => {
      csvRows.push([
        g.ticketCode || '',
        g.name || '',
        g.status || '',
        g.seats || '1',
        g.tableNumber || '',
        g.checkedIn ? 'YES' : 'NO',
        g.checkedInAt ? new Date(g.checkedInAt).toLocaleString() : '',
        g.contact || '',
        g.email || '',
        g.dietary || '',
        (g.wishes || '').replace(/\r?\n/g, ' '),
        g.registeredAt ? new Date(g.registeredAt).toLocaleString() : ''
      ]);
    });

    const csvContent = '\ufeff' + csvRows.map(row => 
      row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')
    ).join('\r\n');

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="RSVP_Cadmus_Matteo_GuestList.csv"'
    });
    return res.end(csvContent);
  }

  // API 9: Full Backup / Sync
  if (pathname === '/api/sync') {
    const data = loadData();
    if (req.method === 'GET') {
      return sendJson(res, 200, data);
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        if (body.guests && Array.isArray(body.guests)) {
          data.guests = body.guests;
        }
        if (body.event && typeof body.event === 'object') {
          data.event = { ...data.event, ...body.event };
        }
        saveData(data);
        if (pgPool && Array.isArray(body.guests)) {
          for (const g of body.guests) {
            pgPool.query(
              `INSERT INTO rsvp_guests (id, ticket_code, name, guest_list, contact, email, status, seats, dietary, wishes, table_number, checked_in, checked_in_at, registered_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
               ON CONFLICT (id) DO UPDATE SET
                 table_number = EXCLUDED.table_number,
                 checked_in = EXCLUDED.checked_in`,
              [g.id, g.ticketCode, g.name, g.guestList, g.contact, g.email, g.status, g.seats, g.dietary, g.wishes, g.tableNumber, g.checkedIn, g.checkedInAt, g.registeredAt]
            ).catch(e => {});
          }
        }
        return sendJson(res, 200, { success: true, count: data.guests.length, lastUpdated: data.lastUpdated });
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }
    }
  }

  // Static File Serving
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  try {
    relativePath = decodeURIComponent(relativePath);
  } catch (e) {}

  let filePath = path.join(__dirname, relativePath);

  if (pathname === '/admin' || pathname === '/dashboard') {
    filePath = path.join(__dirname, 'admin.html');
  } else if (pathname === '/scanner' || pathname === '/checkin') {
    filePath = path.join(__dirname, 'scanner.html');
  } else if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    if (range && (ext === '.mp3' || ext === '.m4a')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      return file.pipe(res);
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': ext === '.mp3' ? 'public, max-age=86400' : 'no-cache, no-store, must-revalidate'
    });
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => { if (!res.headersSent) { res.writeHead(500); res.end(); } });
    res.on('close', () => stream.destroy());
    return stream.pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found - RSVP Cadmus Matteo');
});


process.on('uncaughtException', (err) => {
  console.error('[Server Error Guard] Uncaught Exception:', err && err.message ? err.message : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server Error Guard] Unhandled Rejection:', reason);
});

server.listen(PORT, () => {
  console.log(`[RSVP Cadmus Matteo] Server is running smoothly on port ${PORT}`);
  console.log(`[RSVP Cadmus Matteo] Local URL: http://localhost:${PORT}`);
});
