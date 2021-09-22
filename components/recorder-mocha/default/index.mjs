import Mocha from "mocha";

const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { assert, coalesce, matchVersion },
    expect: { expect },
    agent: {
      openAgent,
      promiseAgentTermination,
      closeAgent,
      createTrack,
      startTrack,
      stopTrack,
    },
  } = dependencies;
  const prototype = coalesce(Mocha, "prototype", _undefined);
  const version = coalesce(prototype, "version", _undefined);
  expect(
    typeof version === "string",
    "mocha.prototype.version should be a string but got: %o",
    version,
  );
  expect(
    matchVersion(version, "8.0.0"),
    "expected mocha.prototype.version >= 8.0.0 but got: %o",
    version,
  );
  return {
    createMochaHooks: (process, configuration) => {
      const { recorder } = configuration;
      assert(recorder === "mocha", "expected mocha recorder");
      const agent = openAgent(configuration);
      const promise = promiseAgentTermination(agent);
      const errors = [];
      process.on("uncaughtExceptionMonitor", (error) => {
        errors.push(error);
      });
      process.on("exit", (status, signal) => {
        const termination = { errors, status };
        if (track !== null) {
          stopTrack(agent, track, termination);
        }
        closeAgent(agent, termination);
      });
      let track = null;
      return {
        promise,
        beforeEach() {
          assert(
            track === null,
            "mocha should not run test cases concurrently ...",
          );
          track = createTrack(agent);
          startTrack(agent, track, {
            path: null,
            options: {
              name: this.currentTest.parent.fullTitle(),
            },
          });
        },
        afterEach() {
          assert(track !== null, "mocha invoked afterEach ");
          stopTrack(agent, track, { errors: [], status: 0 });
          track = null;
        },
      };
    },
  };
};
