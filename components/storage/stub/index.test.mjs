import { buildTestDependenciesAsync } from "../../build.mjs";
import Storage from "./index.mjs";

Storage(await buildTestDependenciesAsync(import.meta.url));
