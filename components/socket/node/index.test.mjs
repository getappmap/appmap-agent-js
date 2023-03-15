import { defineGlobal } from "../../global/index.mjs";

defineGlobal("__APPMAP_SOCKET__", "net");

await import("./index.mjs");
