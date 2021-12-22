import Module from "module";
import { buildTestDependenciesAsync } from "../../build.mjs";

const { createRequire } = Module;
let require = null;
Module.createRequire = (url) => (path) => require(path);

const { default: Socket } = await import("./index.mjs");
const dependencies = await buildTestDependenciesAsync(import.meta.url);

require = () => {
  throw new Error("BOUM");
};
Socket(dependencies);

require = createRequire(import.meta.url);
Socket(dependencies);
