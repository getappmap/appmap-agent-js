import Mocha from "mocha";

const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { assert, coalesce, matchVersion },
    expect: { expect },
    agent: {
      createAgent,
      executeAgentAsync,
      createTrack,
      controlTrack,
      interruptAgent,
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
      const agent = createAgent(configuration);
      const promise = executeAgentAsync(agent);
      const errors = [];
      process.on("uncaughtExceptionMonitor", (error) => {
        errors.push(error);
      });
      process.on("exit", (status, signal) => {
        if (track !== null) {
          controlTrack(agent, track, "stop");
        }
        interruptAgent(agent, { errors, status });
      });
      let track = null;
      return {
        promise,
        beforeEach() {
          assert(
            track === null,
            "mocha should not run test cases concurrently ...",
          );
          track = createTrack(agent, {
            name: this.currentTest.parent.fullTitle(),
          });
          controlTrack(agent, track, "start");
        },
        afterEach() {
          assert(track !== null, "mocha invoked afterEach ");
          controlTrack(agent, track, "stop");
          track = null;
        },
      };
    },
  };
};
