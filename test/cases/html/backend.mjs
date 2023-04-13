import { readFile as readFileCallback } from "node:fs";
import { createServer as createHttpServer } from "node:http";

const { URL, String, Promise } = globalThis;

const toPath = (url) => new URL(url, "http://localhost").pathname;

const aliases = {
  __proto__: null,
  "/": "/index.html",
};

const resolveAlias = (path) => (path in aliases ? aliases[path] : path);

const getExtension = (path) => {
  const segments = path.split(".");
  return `.${segments[segments.length - 1]}`;
};

const extensions = {
  __proto__: null,
  ".js": "text/javascript",
  ".html": "text/html",
};

const toContentType = (extension) =>
  extension in extensions ? extensions[extension] : "text/plain";

export const openBackendAsync = async (port) => {
  const server = createHttpServer();
  const { url: __url } = import.meta;
  server.on("request", (req, res) => {
    const path = resolveAlias(toPath(req.url));
    if (req.method === "GET") {
      readFileCallback(new URL(`public${path}`, __url), (error, body) => {
        if (error) {
          res.writeHead(404);
          res.end();
        } else {
          res.writeHead(200, {
            "content-type": `${toContentType(
              getExtension(path),
            )}; charset=utf-8`,
            "content-length": String(body.length),
          });
          res.end(body);
        }
      });
    } else {
      res.writeHead(400);
      res.end();
    }
  });
  server.listen(port);
  await new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("listening", resolve);
  });
  return server;
};

export const closeBackendAsync = async (server) => {
  server.close();
  await new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("close", resolve);
  });
};
