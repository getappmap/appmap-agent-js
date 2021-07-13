import { createServer } from "http";
import { spawnSync } from "child_process";
import { strict as Assert } from "assert";
import component from "./index.mjs";

const openServerAsync = (respond, port) =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(port);
    server.on("error", reject);
    server.on("listening", () => resolve(server));
    server.on("request", (request, response) => {
      let buffer = "";
      request.on("data", (data) => {
        buffer += data.toString("utf8");
      });
      request.on("end", () => {
        respond(JSON.parse(buffer), response);
      });
    });
  });

const closeServerAsync = (server) =>
  new Promise((resolve, reject) => {
    server.on("close", resolve);
    server.on("error", reject);
    server.close();
  });

const openClient = (server) =>
  component(
    {},
    {
      host: "localhost",
      port:
        typeof server.address() === "string"
          ? server.address()
          : server.address().port,
    },
  ).open();

const testAsync = async () => {
  // happy path (unix-domain-socket) //
  {
    spawnSync("rm", ["tmp/sock", "-f"]);
    const server = await openServerAsync(({ head, body }, response) => {
      Assert.equal(typeof head, "string");
      Assert.equal(body, 123);
      response.end();
      close();
    }, "tmp/sock");
    const { termination, send, close } = openClient(server);
    send(123);
    await termination;
    await closeServerAsync(server);
  }
  // http echec status //
  {
    const server = await openServerAsync(({ head, body }, response) => {
      response.writeHead(400);
      response.end();
    }, 0);
    const { termination, send } = openClient(server);
    send(123);
    try {
      await termination;
      Assert.fail();
    } catch (error) {
      Assert.equal(error.message, "http1 echec status code: 400");
    }
    await closeServerAsync(server);
  }
  // non-empty response body //
  {
    const server = await openServerAsync(({ head, body }, response) => {
      response.end("foo");
    }, 0);
    const { termination, send } = openClient(server);
    send(123);
    try {
      await termination;
      Assert.fail();
    } catch (error) {
      Assert.equal(error.message, "non empty http1 response body");
    }
    await closeServerAsync(server);
  }
};

testAsync().catch((error) => {
  throw error;
});
