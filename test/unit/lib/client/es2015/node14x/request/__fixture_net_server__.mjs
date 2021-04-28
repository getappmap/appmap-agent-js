import { createServer } from 'net';
import { patch } from 'net-socket-messaging';

const server = createServer();

const port = process.argv[2];

server.on('connection', (socket) => {
  patch(socket);
  socket.on('message', (message) => {
    const json = JSON.parse(message);
    socket.send(
      JSON.stringify({
        index: json.index,
        success: json.query.success,
        failure: json.query.failure,
      }),
    );
  });
});

server.listen(port, () => {
  process.send(server.address().port);
});
