import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Time from "./index.mjs";

const { equal: assertEqual } = Assert;

const { now } = Time(await buildTestDependenciesAsync(import.meta.url));
assertEqual(now(), 0);
