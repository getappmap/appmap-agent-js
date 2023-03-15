import { defineGlobal } from "../../global/index.mjs";
import { createConfiguration } from "../../configuration/index.mjs";
defineGlobal(
  "__APPMAP_CONFIGURATION__",
  createConfiguration("file:///w:/home/"),
);
await import("./index.mjs");
