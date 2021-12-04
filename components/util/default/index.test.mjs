import { buildTestDependenciesAsync } from "../../build.mjs";
import Util from "./index.mjs";

Util(await buildTestDependenciesAsync(import.meta.url));
