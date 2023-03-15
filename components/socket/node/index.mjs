import { readGlobal } from "../../global/index.mjs";
import { generateSocket } from "./index-isolate.mjs";

export const { openSocket, closeSocket, sendSocket } = generateSocket(
  readGlobal("__APPMAP_SOCKET__"),
);
