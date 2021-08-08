import { buildDependenciesAsync } from "../../build.mjs";
import Log from "./index.mjs";

const testAsync = async () => {
  Log(await buildDependenciesAsync(import.meta.url, "test"));
};

testAsync();
