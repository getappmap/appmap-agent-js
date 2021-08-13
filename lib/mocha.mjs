import RecorderBoot from "../dist/node-recorder-boot.mjs";
import RecorderProcess from "../dist/node-recorder-process.mjs";
import {createBlueprint} from "./blueprint.mjs";

const {
  loadConfiguration,
  isConfigurationEnabled,
} = RecorderBoot({log:"info"});
const configuration = loadConfiguration(process);
export let beforeEach = () => {};
export let afterEach = () => {};
if (isConfigurationEnabled(configuration)) {
  const { createMochaHooks } = RecorderProcess(createBlueprint(configuration));
  ({beforeEach, afterEach} = createMochaHooks(process, configuration));
}
