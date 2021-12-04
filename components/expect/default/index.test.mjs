import { buildTestDependenciesAsync } from "../../build.mjs";
import Expect from "./index.mjs";

Expect(await buildTestDependenciesAsync(import.meta.url));
