/* eslint-env node */
import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Agent from "./index.mjs";

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const {
  openAgent,
  promiseAgentTermination,
  closeAgent,
  createTrack,
  startTrack,
  stopTrack,
} = Agent(dependencies);
const agent = openAgent(
  extendConfiguration(
    createConfiguration("/"),
    {
      hooks: {
        apply: false,
        cjs: false,
        esm: false,
        group: false,
        mysql: false,
        http: false,
      },
    },
    "/",
  ),
);
setTimeout(() => {
  const track = createTrack(agent);
  startTrack(agent, track, {});
  stopTrack(agent, track, { errors: [], status: 0 });
  closeAgent(agent, { errors: [], status: 123 });
});
assertDeepEqual(
  (await promiseAgentTermination(agent)).map(([type]) => type),
  ["initialize", "start", "stop", "terminate"],
);
