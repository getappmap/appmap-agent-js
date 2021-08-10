
import {buildAllAsync, buildOneAsync} from "../../build/index.mjs";
import {loadRootConfiguration, isConfigurationEnabled} from "./configuration.mjs";
export {transformSource} from "./loader.mjs"

const { cwd, env, argv } = process;
const configuration = loadRootConfiguration(cwd, env);
const {"log-level":log_level, recorder, protocol, enabled} = configuration;

if (isConfigurationEnabled(configuration, argv)) {
  const {
    expec: {expect},
    log: {logInfo, logError},
    agent: {createAgent, executeAgentAsync, createTrack, controlTrack, interruptAgent},
  } = await buildAllAsync(
    ["log", "agent"],
    "node",
    {recorder, log:log_level, client:protocol},
  );
  expect(
    recorder === "process",
    "expected recorder to be 'process', got: %j",
    recorder
  );
  logInfo("intercepting %s", argv1);
  const agent = createAgent(configuration);
  executeAgentAsync(agent).then(() => {
    logInfo("Done");
  }, (error) => {
    logError("%e", error);
  });
  const track = createTrack(agent, {
    main: toAbsolutePath(cwd(), argv1),
  });
  controlTrack(agent, track, "start");
  const errors = [];
  process.on("uncaughtExceptionMonitor", (error) => {
    errors.push(error);
  });
  process.on("exit", (status, signal) => {
    controlTrack(agent, track, "stop");
    interruptAgent(agent, { errors, status });
  });
} else {
  const {logInfo} = buildOneAsync("log", "node", {log:log_level});
  logInfo("bypassing %j", argv1);
}
