import { buildTestDependenciesAsync } from "../../build.mjs";
import { getFreshTemporaryURL } from "../../__fixture__.mjs";
import LogInner from "./index.mjs";

const {
  process,
  JSON: {stringify: stringifyJSON},
} = globalThis;

const testAsync = async () => {
  const { logInfo } = LogInner(
    await buildTestDependenciesAsync(import.meta.url),
  );
  logInfo("foo %s", "bar");
};

await testAsync();

process.env.APPMAP_LOG_FILE = stringifyJSON(getFreshTemporaryURL());
await testAsync();
