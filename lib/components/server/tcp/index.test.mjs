import { strict as Assert } from "assert";
import { connect } from "net";
import { spawnSync } from "child_process";
import { patch } from "net-socket-messaging";
import component from "./index.mjs";

const testAsync = async () => {
  // happy path (unix-domain socket) //
  {
    spawnSync("rm", ["tmp/sock", "-f"]);
    const { life, close, port } = await component(
      {
        backend: {
          open: () => ({
            close: () => {
              close();
            },
            receive: (data) => {
              Assert.equal(data, 123);
              socket.end();
            },
          }),
        },
      },
      { port: "tmp/sock" },
    ).openAsync();
    connect(port);
    const socket = connect(port);
    patch(socket);
    socket.send("123");
    await life;
  }
  // unhappy path //
  {
    const { life, port } = await component(
      {
        backend: {
          open: () => ({
            close: () => {
              console.log("foo", "close");
            },
            receive: (data) => {
              Assert.fail();
            },
          }),
        },
      },
      { port: 0 },
    ).openAsync();
    connect(port);
    global.setTimeout(() => {
      const socket = connect(port);
      socket.on("connect", () => {
        socket.destroy();
      });
    });
    try {
      console.log("foo");
      await life;
      console.log("bar");
    } catch (error) {
      console.log(error);
    }
  }
};

testAsync().catch((error) => {
  throw error;
});
