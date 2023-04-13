import Http from "node:http";
const { String } = globalThis;
const server = Http.createServer();
server.on("request", function onServerRequest(request, response) {
  request.on("data", function onServerRequestData() {});
  request.on("end", function onServerRequestEnd() {
    response.removeHeader("date");
    response.writeHead(200, "ok");
    response.end();
  });
});
server.on("listening", function onServerListening() {
  const { port } = server.address();
  const request = Http.request(`http://localhost:${String(port)}`);
  request.setHeader("connection", "close");
  request.end();
  request.on("response", function onClientResponse(response) {
    response.on("data", function onClientResponseData() {});
    response.on("end", function onClientResponseEnd() {
      server.close();
    });
  });
});
server.listen(8888);
