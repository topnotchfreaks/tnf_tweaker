// Example Node.js/Express backend
const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();

app.get('/api/device/model', (req, res) => {
  fs.readFile('/system/build.prop', 'utf8', (err, data) => {
    if (err) return res.json({ model: 'Unavailable' });
    const match = data.match(/^ro\.product\.model=(.+)$/m);
    res.json({ model: match ? match[1] : 'Unknown' });
  });
});

app.get('/api/device/kernel', (req, res) => {
  exec('uname -r', (err, stdout) => {
    if (err) return res.json({ version: 'Unavailable' });
    res.json({ version: stdout.trim() });
  });
});

app.listen(3000, () => console.log('API running on port 3000'));