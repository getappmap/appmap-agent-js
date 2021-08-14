
import RecorderBoot from "../dist/node-recorder-boot.mjs";
import RecorderMocha from "../dist/node-recorder-mocha.mjs";
import { createBlueprint } from "./blueprint.mjs";

const {assign} = Object;

const { loadConfiguration, isConfigurationEnabled } = RecorderBoot({
  log: "info",
});
const configuration = loadConfiguration(process);
const hooks = {};
export const mochaHooks = hooks;
if (isConfigurationEnabled(configuration)) {
  const { createMochaHooks } = RecorderMocha(createBlueprint(configuration));
  assign(
    hooks,
    createMochaHooks(process, configuration),
  );
}
