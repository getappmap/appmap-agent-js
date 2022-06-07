import { assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Version from "./version.mjs";

Error.stackTraceLimit = Infinity;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { getEcmaVersion } = Version(dependencies);

assertEqual(getEcmaVersion({ name: "foo", version: "2020" }), "latest");

assertEqual(getEcmaVersion({ name: "ecmascript", version: "2020" }), 2020);

assertEqual(getEcmaVersion({ name: "javascript", version: "foo" }), "latest");
