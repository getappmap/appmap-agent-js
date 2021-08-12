import { buildTestDependenciesAsync } from "../../build.mjs";
import ValidateAppmap from "./index.mjs";

ValidateAppmap(await buildTestDependenciesAsync(import.meta.url));
