/* globals setTimeout, $uuid */

import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import HookApply from "./index.mjs";

const _undefined = undefined;
const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    state: { createState, initializeState },
    client: { initializeClient, terminateClient },
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { hookApplyAsync } = HookApply(dependencies);
  {
    const buffer = [];
    const configuration = extendConfiguration(createConfiguration("/"), {
      hooks: { apply: false },
      "client-spy-buffer": buffer,
    });
    const state = createState(configuration);
    const client = initializeClient(configuration);
    initializeState(state);
    setTimeout(terminateClient, 0, client);
    await hookApplyAsync(client, state, configuration);
    assertDeepEqual(buffer, []);
  }
  {
    const buffer = [];
    const configuration = extendConfiguration(createConfiguration("/"), {
      hooks: { apply: true },
      "client-spy-buffer": buffer,
      "hidden-identifier": "$",
    });
    const state = createState(configuration);
    const client = initializeClient(configuration);
    initializeState(state);
    setTimeout(() => {
      const index = $uuid.beforeApply("function", 123, [456]);
      assertEqual($uuid.afterApply(index, null, 789), _undefined);
      terminateClient(client);
    }, 0);
    await hookApplyAsync(client, state, configuration);
    assertDeepEqual(buffer, [
      {
        type: "send",
        session: "uuid",
        data: {
          type: "event",
          data: {
            type: "before",
            index: 1,
            data: {
              type: "apply",
              function: "function",
              this: { type: "number", value: 123 },
              arguments: [{ type: "number", value: 456 }],
            },
            group: 0,
            time: 0,
          },
        },
      },
      {
        type: "send",
        session: "uuid",
        data: {
          type: "event",
          data: {
            type: "after",
            index: 1,
            data: {
              type: "apply",
              error: { type: "null" },
              result: { type: "number", value: 789 },
            },
            group: 0,
            time: 0,
          },
        },
      },
    ]);
  }
};

testAsync();
