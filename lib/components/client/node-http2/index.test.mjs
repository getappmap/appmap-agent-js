import { createServer } from "http2";
import { spawnSync } from "child_process";
import { strict as Assert } from "assert";
import component from "./index.mjs";

const openServerAsync = (respond, port) =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(port);
    server.on("error", reject);
    server.on("listening", () => resolve(server));
    server.on("stream", (stream) => {
      let buffer = "";
      stream.on("data", (data) => {
        buffer += data.toString("utf8");
      });
      stream.on("end", () => {
        respond(JSON.parse(buffer), stream);
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
    const server = await openServerAsync((body, stream) => {
      Assert.equal(body, 123);
      stream.respond({ ":status": 200 });
      stream.end();
      close();
    }, "tmp/sock");
    const { life, send, close } = openClient(server);
    send(123);
    await life;
    await closeServerAsync(server);
  }
  // http echec status //
  {
    const server = await openServerAsync(({ head, body }, stream) => {
      stream.respond({ ":status": 400 });
      stream.end();
    }, 0);
    const { life, send } = openClient(server);
    send(123);
    try {
      await life;
      Assert.fail();
    } catch (error) {
      Assert.equal(error.message, "http2 echec status code: 400");
    }
    await closeServerAsync(server);
  }
  // non-empty response body //
  {
    const server = await openServerAsync(({ head, body }, stream) => {
      stream.respond({ ":status": 200 });
      stream.end("foo");
    }, 0);
    const { life, send } = openClient(server);
    send(123);
    try {
      await life;
      Assert.fail();
    } catch (error) {
      Assert.equal(error.message, "non empty http2 response body");
    }
    await closeServerAsync(server);
  }
};

testAsync().catch((error) => {
  throw error;
});
