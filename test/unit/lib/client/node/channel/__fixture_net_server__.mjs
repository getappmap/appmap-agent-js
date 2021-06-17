import { createServer } from 'net';
import { patch } from 'net-socket-messaging';

const server = createServer();

const port = process.argv[2];

server.on('connection', (socket) => {
  patch(socket);
  socket.on('message', (message) => {
    const json = JSON.parse(message);
    if (json.head !== null) {
      socket.send(
        JSON.stringify({
          head: json.head,
          type: json.body.type,
          body: json.body.body,
        }),
      );
    }
  });
});

server.listen(port, () => {
  process.send(server.address().port);
});
