const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logInfo, logErrorWhen } = await import(
  `../../log/index.mjs${__search}`
);
const { hook } = await import(`../../hook/index.mjs${__search}`);
const { assert } = await import(`../../util/index.mjs${__search}`);
const { isConfigurationEnabled, extendConfigurationNode } = await import(
  `../../configuration-accessor/index.mjs${__search}`
);
const { openAgent, recordStartTrack, recordStopTrack } = await import(
  `../../agent/index.mjs${__search}`
);

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
