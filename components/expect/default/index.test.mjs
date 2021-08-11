import { buildTestDependenciesAsync } from "../../build.mjs";
import Expect from "./index.mjs";

const testAsync = async () => {
  Expect(await buildTestDependenciesAsync(import.meta.url));
};

testAsync();
