/* eslint-env node */
import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Agent from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const {
  openAgent,
  closeAgent,
  recordAgentScript,
  takeLocalAgentTrace,
  startTrack,
  stopTrack,
} = Agent(dependencies);
const agent = openAgent(
  extendConfiguration(
    createConfiguration("/"),
    {
      packages: ["*"],
      hooks: {
        apply: false,
        cjs: false,
        esm: false,
        mysql: false,
        http: false,
      },
    },
    "/",
  ),
);
startTrack(agent, "record", { path: null, data: {} });
assertEqual(
  recordAgentScript(agent, { url: "file:///main.js", content: "123;" }),
  123,
);
stopTrack(agent, "record", { errors: [], status: 0 });
closeAgent(agent, { errors: [], status: 123 });
const { sources, events } = takeLocalAgentTrace(agent, "record");
assertDeepEqual(
  { sources, events },
  {
    sources: [
      {
        url: "file:///main.js",
        content: "123;",
        exclude: createConfiguration("/dummy").exclude,
        shallow: false,
        inline: false,
      },
    ],
    events: [],
  },
);
