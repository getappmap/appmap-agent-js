import { env } from "node:process";
import { generateSocket } from "./index-isolate.mjs";
export const { openSocket, closeSocket, sendSocket } = generateSocket(env);
