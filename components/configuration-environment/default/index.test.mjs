import "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs";
import { loadEnvironmentConfiguration } from "./index.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

loadEnvironmentConfiguration({
  APPMAP_CONFIGURATION: stringifyJSON(
    createConfiguration("protocol://host/home"),
  ),
});
