import { buildTestDependenciesAsync } from "../../build.mjs";
import Util from "./index.mjs";

const testAsync = async () => {
  Util(await buildTestDependenciesAsync(import.meta.url));
};

testAsync();
