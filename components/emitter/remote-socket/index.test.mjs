import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Emitter from "./index.mjs";

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const { openEmitter, closeEmitter, sendEmitter } = Emitter(
  await buildTestDependenciesAsync(import.meta.url),
);

const configuration = extendConfiguration(
  createConfiguration("/cwd"),
  {
    host: "localhost",
  },
  null,
);

const emitter = openEmitter(configuration);
sendEmitter(emitter, 123);
closeEmitter(emitter);
sendEmitter(emitter, 456);
