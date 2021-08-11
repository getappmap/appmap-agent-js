import { buildTestDependenciesAsync } from "../../build.mjs";
import Server from "./index.mjs";

Server(await buildTestDependenciesAsync(import.meta.url));
