import { buildTestDependenciesAsync } from "../../build.mjs";

import Receptor from "./index.mjs";

Receptor(await buildTestDependenciesAsync(import.meta.url));
