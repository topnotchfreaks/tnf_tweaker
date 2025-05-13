const http = require('http');
const { exec } = require('child_process');

const PORT = 8080;

const respond = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') return respond(res, 405, { error: 'Method Not Allowed' });

  const path = req.url;

  const map = {
    '/api/device/model': 'tnf_info get_model',
    '/api/device/kernel': 'tnf_info get_kernel',
    '/api/device/sdk': 'tnf_info get_sdk',
    '/api/device/chipset': 'tnf_info get_chipset'
  };

  const command = map[path];

  if (!command) return respond(res, 404, { error: 'Not Found' });

  exec(`su -c "${command}"`, (err, stdout) => {
    if (err) return respond(res, 500, { error: err.message });
    respond(res, 200, { result: stdout.trim() });
  });
});

server.listen(PORT, () => {
  console.log(`TNF WebUI backend running on port ${PORT}`);
});
