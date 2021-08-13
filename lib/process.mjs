import RecorderBoot from "../dist/node-recorder-boot.mjs";
import RecorderProcess from "../dist/node-recorder-process.mjs";
export * from "./loader.mjs";
import {createBlueprint} from "./blueprint.mjs";

const {
  loadConfiguration,
  isConfigurationEnabled,
} = RecorderBoot({log:"info"});
const configuration = loadConfiguration(process);
if (isConfigurationEnabled(configuration)) {
  const { mainAsync } = RecorderProcess(createBlueprint(configuration));
  mainAsync(process, configuration);
}
