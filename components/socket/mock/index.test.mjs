import {
  assertThrow,
  assertEqual,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import { readGlobal } from "../../global/index.mjs";
import {
  openSocket,
  addSocketListener,
  removeSocketListener,
  isSocketReady,
  sendSocket,
  closeSocket,
} from "./index.mjs";

const { Promise } = globalThis;

const getLastMockSocket = readGlobal("GET_LAST_MOCK_SOCKET");
const getMockSocketBuffer = readGlobal("GET_MOCK_SOCKET_BUFFER");
const receiveMockSocket = readGlobal("RECEIVE_MOCK_SOCKET");

const socket = openSocket({});

assertEqual(socket, getLastMockSocket());

assertEqual(isSocketReady(socket), true);

await new Promise((resolve) => {
  addSocketListener(socket, "open", resolve);
});

sendSocket(socket, "output");

receiveMockSocket(socket, "input");

assertEqual(
  await new Promise((resolve) => {
    addSocketListener(socket, "message", resolve);
  }),
  "input",
);

closeSocket(socket);

assertEqual(isSocketReady(socket), false);

await new Promise((resolve) => {
  addSocketListener(socket, "close", resolve);
});

assertThrow(() => sendSocket(socket, "after"), /^Error: socket not ready$/u);

assertDeepEqual(getMockSocketBuffer(socket), ["output"]);

removeSocketListener(socket, "message", () => {});
