/* eslint-env node */
import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Frontend from "./index.mjs";

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
    createFrontend,
    executeFrontendAsync,
    getCurrentTransformSource,
    interruptFrontend,
    createTrack,
    controlTrack,
  } = Frontend(dependencies);
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
  const frontend = createFrontend();
  assertEqual(typeof getCurrentTransformSource(frontend), "function");
  setTimeout(() => {
    const track = createTrack(frontend);
    controlTrack(frontend, track, "start");
    interruptFrontend(frontend, "reason");
  });
  assertDeepEqual(
    (await executeFrontendAsync(frontend, configuration)).map(
      ({ type }) => type,
    ),
    ["initialize", "send", "terminate"],
  );
};

testAsync();
