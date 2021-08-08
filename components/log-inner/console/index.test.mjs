import { buildDependenciesAsync } from "../../build.mjs";
import LogInner from "./index.mjs";

const testAsync = async () => {
  const { logInfo } = LogInner(
    await buildDependenciesAsync(import.meta.url, "test"),
  );
  logInfo("foo %s", "bar");
};

testAsync();
