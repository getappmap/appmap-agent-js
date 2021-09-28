import { buildTestDependenciesAsync } from "../../build.mjs";
import Prompts from "./index.mjs";

Prompts(await buildTestDependenciesAsync(import.meta.url));
