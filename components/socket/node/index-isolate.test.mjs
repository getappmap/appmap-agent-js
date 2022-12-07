import { generateSocket } from "./index-isolate.mjs";

generateSocket({ APPMAP_SOCKET: "unix" });
generateSocket({ APPMAP_SOCKET: "net" });
