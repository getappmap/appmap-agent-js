import { createServer as createHttp1Server } from 'http';
import { createServer as createHttp2Server } from 'http2';

const protocol = process.argv[2];
const port = process.argv[3];

let server;
if (protocol === 'http1') {
  server = createHttp1Server();
} else if (protocol === 'http2') {
  server = createHttp2Server();
} else {
  throw new Error(`Invalid protocol ${protocol}`);
}

server.on('request', (request, response) => {
  let body = '';
  request.setEncoding('utf8');
  request.on('data', (data) => {
    body += data;
  });
  request.on('end', () => {
    const json = JSON.parse(body);
    response.writeHead(json.status);
    response.end(json.body);
  });
});

server.listen(port, () => {
  process.send(server.address().port);
});
