/* eslint-env node */
import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Agent from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

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
    getCurrentTransformSource,
    interruptAgent,
    createTrack,
    controlTrack,
  } = Agent(dependencies);
  const configuration = extendConfiguration(
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
  );
  const agent = createAgent();
  assertEqual(typeof getCurrentTransformSource(agent), "function");
  setTimeout(() => {
    const track = createTrack(agent);
    controlTrack(agent, track, "start");
    interruptAgent(agent, "reason");
  });
  assertDeepEqual(
    (await executeAgentAsync(agent, configuration)).map(({ type }) => type),
    ["initialize", "send", "terminate"],
  );
};

testAsync();
