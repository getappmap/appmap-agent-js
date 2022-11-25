import { ExternalAppmapError } from "../../error/index.mjs";
import { logInfo, logErrorWhen } from "../../log/index.mjs";
import { hook } from "../../hook/index.mjs";
import { assert } from "../../util/index.mjs";
import {
  isConfigurationEnabled,
  extendConfigurationNode,
} from "../../configuration-accessor/index.mjs";
import {
  openAgent,
  recordStartTrack,
  recordStopTrack,
} from "../../agent/index.mjs";

const { String } = globalThis;

export const createMochaHooks = (process, configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  const enabled = isConfigurationEnabled(configuration);
  if (enabled) {
    logInfo(
      "Recording mocha test cases of process #%j -- %j",
      process.pid,
      process.argv,
    );
    const agent = openAgent(configuration);
    hook(agent, configuration);
    let running = null;
    return {
      beforeEach() {
        const name = this.currentTest.parent.fullTitle();
        assert(
          !logErrorWhen(
            running !== null,
            "Detected conccurent mocha test cases: %j and %j",
            running,
            name,
          ),
          "Concurrent mocha test cases",
          ExternalAppmapError,
        );
        running = name;
        recordStartTrack(
          agent,
          "mocha",
          {
            "map-name": name,
          },
          null,
        );
      },
      afterEach() {
        recordStopTrack(agent, "mocha", {
          type: "test",
          passed: this.currentTest.state === "passed",
        });
        running = null;
      },
    };
  } else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
    return {};
  }
};
