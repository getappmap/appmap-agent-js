import { buildDependenciesAsync } from "../../build.mjs";
import Expect from "./index.mjs";

const testAsync = async () => {
  Expect(await buildDependenciesAsync(import.meta.url, "test"));
};

testAsync();
