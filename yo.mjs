// import * as Net from "net";
//
// const server = Net.createServer();
// server.listen(0);
// server.on("connection", (socket) => {
//   socket.on("data", (buffer) => {
//     socket.write(buffer);
//   });
// });
// server.on("listening", () => {
//   const socket = new Net.Socket();
//     // socket.write("foo");
//   socket.connect(server.address().port);
//     socket.write("bar");
//   socket.on("data", (buffer) => {
//     console.log(buffer.toString("utf8"));
//   });
//
//
// });
