const express = require('express')
const port = 3000

const server = require("http").createServer();

server.on("request", (req, res) => {
  let route = null;
  Reflect.defineProperty(req, "route", {
    enumerable: true,
    configurable: false,
    set: (value) => {
      debugger;
      console.log("set-route", route = value);
      return true;
    },
    get: () => {
      console.log("get-route", route);
      return route;
    }
  });
});

const app = express()
console.log("foo", app);

app.get('/foo/:bar', (req, res) => {
  res.send(JSON.stringify(req.params));
});

server.on("request", app);

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
