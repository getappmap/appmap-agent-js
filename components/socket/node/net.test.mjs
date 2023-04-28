import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import {
  createSocket,
  isSocketReady,
  openSocketAsync,
  sendSocket,
  closeSocketAsync,
} from "./net.mjs";
import { testAsync } from "./__fixture__.mjs";

const runAsync = async (port) => {
  const socket = createSocket({
    host: "localhost",
    "trace-port": port,
    heartbeat: 10000,
    threshold: 0,
  });
  assertEqual(isSocketReady(socket), false);
  sendSocket(socket, "before");
  await openSocketAsync(socket);
  assertEqual(isSocketReady(socket), true);
  sendSocket(socket, "message");
  await closeSocketAsync(socket);
  assertEqual(isSocketReady(socket), false);
  sendSocket(socket, "after");
};

assertDeepEqual(await testAsync(0, runAsync), ["message"]);

assertDeepEqual(
  await testAsync(toAbsoluteUrl(getUuid(), getTmpUrl()), runAsync),
  ["message"],
);
