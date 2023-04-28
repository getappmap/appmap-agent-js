import { readGlobal } from "../../global/index.mjs";
import { generateSocket } from "./index-isolate.mjs";

export const {
  createSocket,
  openSocketAsync,
  isSocketReady,
  closeSocketAsync,
  sendSocket,
} = generateSocket(readGlobal("__APPMAP_SOCKET__"));
