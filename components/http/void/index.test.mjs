import { buildTestDependenciesAsync } from "../../build.mjs";
import Request from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);

Request(dependencies);
