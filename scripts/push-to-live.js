const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'rsvp-data.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

console.log(`Pushing ${data.guests.length} guests to Render live cloud (https://rsvp-cadmus-matteo.onrender.com/api/sync)...`);

const payload = JSON.stringify({
  guests: data.guests,
  event: data.event
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
    console.log(`Response status: ${res.statusCode}`);
    console.log(`Response body: ${body}`);
  });
});

req.on('error', (err) => {
  console.error('Request failed:', err.message);
});

req.write(payload);
req.end();
