/* eslint-env node */
import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Agent from "./index.mjs";

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
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
    ["initialize", "send", "terminate"],
  );
};

testAsync();
