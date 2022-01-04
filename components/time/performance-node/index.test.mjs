import { assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Time from "./index.mjs";

const { now } = Time(await buildTestDependenciesAsync(import.meta.url));
assertEqual(typeof now(), "number");
