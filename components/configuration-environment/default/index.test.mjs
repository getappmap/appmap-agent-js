import "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs?env=test";
import { loadEnvironmentConfiguration } from "./index.mjs?env=test";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

loadEnvironmentConfiguration({
  APPMAP_CONFIGURATION: stringifyJSON(createConfiguration("file:///home")),
});
