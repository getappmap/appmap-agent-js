import { assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs?env=test";
import { getTmpUrl } from "../../path/index.mjs?env=test";
import { toAbsoluteUrl } from "../../url/index.mjs?env=test";
import { openSocket, closeSocket, sendSocket } from "./index.mjs?env=test";
import { testAsync } from "../__fixture__.mjs";

const { Promise, setTimeout } = globalThis;

const sleepAsync = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const runAsync = async (port) => {
  const socket = openSocket("localhost", port, {
    heartbeat: 10000,
    threshold: 0,
  });
  sendSocket(socket, "message1");
  await sleepAsync(1000);
  sendSocket(socket, "message2");
  closeSocket(socket);
  await sleepAsync(1000);
  sendSocket(socket, "message3");
};

assertDeepEqual(await testAsync(0, runAsync), ["message1", "message2"]);

assertDeepEqual(
  await testAsync(toAbsoluteUrl(getUuid(), getTmpUrl()), runAsync),
  ["message1", "message2"],
);
