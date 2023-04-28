import {
  assertThrow,
  assertEqual,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import { readGlobal } from "../../global/index.mjs";
import { createConfiguration } from "../../configuration/index.mjs";
import {
  createSocket,
  isSocketReady,
  openSocketAsync,
  sendSocket,
  closeSocketAsync,
} from "./index.mjs";

const socket = createSocket(createConfiguration("protocol://host/home/"));

assertEqual(isSocketReady(socket), false);

assertThrow(() => sendSocket(socket, "before"), /^Error: socket not ready$/u);

await openSocketAsync(socket);

assertEqual(isSocketReady(socket), true);

sendSocket(socket, "message");

await closeSocketAsync(socket);

assertEqual(isSocketReady(socket), false);

assertThrow(() => sendSocket(socket, "after"), /^Error: socket not ready$/u);

assertDeepEqual(readGlobal("GET_LAST_MOCK_SOCKET_BUFFER")(), ["message"]);
