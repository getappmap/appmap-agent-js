import { buildTestDependenciesAsync } from "../../build.mjs";
import ValidateMessage from "./index.mjs";

ValidateMessage(await buildTestDependenciesAsync(import.meta.url));
