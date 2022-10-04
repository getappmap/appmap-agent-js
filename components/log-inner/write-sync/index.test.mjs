import { getFreshTemporaryURL } from "../../__fixture__.mjs";
import { logInfo, reloadLogFile } from "./index.mjs?env=test";

const {
  process,
  JSON: { stringify: stringifyJSON },
} = globalThis;

logInfo("foo %s", "bar");

process.env.APPMAP_LOG_FILE = stringifyJSON(getFreshTemporaryURL());

reloadLogFile();

logInfo("foo %s", "bar");
