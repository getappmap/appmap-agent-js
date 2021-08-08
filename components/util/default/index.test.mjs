import { buildDependenciesAsync } from "../../build.mjs";
import Util from "./index.mjs";

const testAsync = async () => {
  Util(await buildDependenciesAsync(import.meta.url, "test"));
};

testAsync();
