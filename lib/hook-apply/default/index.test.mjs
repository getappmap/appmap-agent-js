import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import HookApply from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildAsync({
    violation: "error",
    assert: "debug",
    util: "default",
    uuid: "stub",
    instrumentation: "default",
    time: "stub",
    interpretation: "node",
    client: "spy",
    serialization: "default",
    state: "default",
    repository: "stub",
    configuration: "default",
  });
  const {client:{initializeClient, terminateClient}, configuration:{createConfiguration}} = dependencies;
  const { hookApplyAsync } = HookApply(dependencies);
  const buffer = [];
  const configuration = extendConfiguration(
    createConfiguration("/"),
    {hooks:{apply:true}, "client-spy-buffer": buffer},
  );
  const state = createState(configuration);
  const client = initializeClient(configuration);
  initializeState(state);
  const promise = hookApplyAsync(client, state, configuration);
  const identifier = getInstrumentationIdentifier(state);
  const runtime = _eval(identifier);
  const index = runtime.beforeApply();
};

testAsync();
