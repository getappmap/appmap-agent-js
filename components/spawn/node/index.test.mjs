import { buildTestDependenciesAsync } from "../../build.mjs";
import Spawn from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
Spawn(dependencies);
