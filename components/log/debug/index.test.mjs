import { buildTestDependenciesAsync } from "../../build.mjs";
import Log from "./index.mjs";

Log(await buildTestDependenciesAsync(import.meta.url));
