import { buildTestDependenciesAsync } from "../../build.mjs";
import Log from "./index.mjs";

const testAsync = async () => {
  Log(await buildTestDependenciesAsync(import.meta.url));
};

testAsync();
