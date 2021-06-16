import {createServer} from "http";
const server = createServer();
server.listen(0, function onListening () {
  console.log(`listening to port ${server.address().port}`);
  server.on("request", function onRequest (req, res) {
    setTimeout(function onTimeout1() {
      res.writeHead(200);
    }, 1000);
    setTimeout(function onTimeout2() {
      res.end("foobar");
    }, 2000);
  });
});
