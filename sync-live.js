const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'rsvp-data.json');

console.log('Fetching latest live guests from Render cloud...');

https.get('https://rsvp-cadmus-matteo.onrender.com/api/guests', (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      if (json.success && Array.isArray(json.guests)) {
        let localData = { event: {}, guests: [] };
        if (fs.existsSync(DATA_FILE)) {
          localData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
        
        // Merge guests by ID so none are lost
        const guestMap = new Map();
        (localData.guests || []).forEach(g => guestMap.set(g.id, g));
        json.guests.forEach(g => guestMap.set(g.id, g));

        localData.guests = Array.from(guestMap.values());
        localData.lastUpdated = new Date().toISOString();

        fs.writeFileSync(DATA_FILE, JSON.stringify(localData, null, 2), 'utf8');
        console.log(`✅ SUCCESS: Synced ${localData.guests.length} total guests from Render cloud into local rsvp-data.json!`);
      } else {
        console.error('Failed to parse guests from Render:', json);
      }
    } catch (e) {
      console.error('Error processing sync:', e);
    }
  });
}).on('error', (err) => {
  console.error('Network error fetching from Render:', err);
});
