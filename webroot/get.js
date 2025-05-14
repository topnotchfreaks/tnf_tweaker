import http from 'http';
import { exec } from 'kernelsu';

const PORT = 8080;

const server = http.createServer((req, res) => {
  let command = null;

  if (req.url === '/api/device/model') {
    command = 'getprop ro.product.model';
  } else if (req.url === '/api/device/kernel') {
    command = 'uname -r';
  }

  if (command) {
    exec(command, (err, stdout) => {
      const value = err ? 'Unknown' : stdout.trim();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: value }));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result: 'Unknown' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


