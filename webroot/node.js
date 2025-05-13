const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Kernel version
app.get('/api/device/kernel', (req, res) => {
  exec('uname -r', (err, stdout) => {
    if (err) {
      console.error('Kernel fetch failed:', err);
      return res.status(500).json({ version: null });
    }
    res.json({ version: stdout.trim() });
  });
});

// Device model
app.get('/api/device/model', (req, res) => {
  exec('getprop ro.product.model', (err, stdout) => {
    if (err || !stdout.trim()) {
      console.error('Model fetch failed:', err);
      return res.status(500).json({ model: null });
    }
    res.json({ model: stdout.trim() });
  });
});

// Module status (fake for now)
app.get('/api/module/status', (req, res) => {
  // Later you can check an actual module path or daemon
  res.json({ installed: true });
});

// Run server
app.listen(PORT, () => {
  console.log(`✅ TNF Tweaker running at http://localhost:${PORT}`);
});
