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

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { createConfiguration, extendConfiguration } =
    await buildTestComponentAsync("configuration", "test");
  const {
    createAgent,
    executeAgentAsync,
    interruptAgent,
    createTrack,
    controlTrack,
  } = Agent(dependencies);
  const agent = createAgent(
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
    controlTrack(agent, track, "start");
    interruptAgent(agent, { errors: [], status: 123 });
  });
  assertDeepEqual(
    (await executeAgentAsync(agent)).map(({ type }) => type),
    ["initialize", "trace", "terminate"],
  );
};

testAsync();
