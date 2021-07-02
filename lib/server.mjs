
const {createServer} = require("./node.mjs");

const server = createServer(JSON.parse(process.env.APPMAP_CONFIGURATION));

server.on("listening", () => {
  process.send("ready");
});
