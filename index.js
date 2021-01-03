const http = require('http');
const net = require('net');
function buildHeaders(headers) {
  const arr = [];
  for (const [k, v] of Object.entries(headers)) {
    arr.push(`${k}:${v}\r\n`)
  }
  return arr.join('');
}

function getHostAndPort(req) {
  let host;
  let port;
  try {
    [host, port] = new URL(req.url);
  } catch(e) {
    [host, port] = req.headers.host.split(':');
  } finally {
      if (!port) {
          port = 80;
      }
  }
  console.log(host, port);
  return [host, port];
}
const server = http.createServer((req, res) => {
  const [host, port] = getHostAndPort(req);
  http.get({
    port,
    host,
    path: req.url
  }, (response) => {
    response.pipe(res);
  });
});

server.on('upgrade', (req, res, head) => {
  const [host, port] = getHostAndPort(req);
  const client = net.connect({
    port,
    host,
  });
  client.on('connect', () => {
    client.write(`GET ${req.url}\r\n` + buildHeaders(req.headers) + '\r\n');
    res.pipe(client);
    client.pipe(res);
  });
  client.on('error', () => {
    res.destroy();
  })
});
server.on('connect', (req, client, head) => {
  const [host, port] = getHostAndPort(req);
  const socket = net.connect(port, host, () => {
    client.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');
    socket.write(head);
    socket.pipe(client);
    client.pipe(socket);
  });
});
server.listen(90)

process.on('uncaughtException', () => {

});
