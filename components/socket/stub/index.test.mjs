import { buildTestDependenciesAsync } from "../../build.mjs";
import StubSocket from "./index.mjs";

StubSocket(await buildTestDependenciesAsync(import.meta.url));
