import Boot from "../dist/node-boot.mjs";
import RecorderMocha from "../dist/node-recorder-mocha.mjs";
import { getBootBlueprint, createBlueprint } from "./blueprint.mjs";

const { bootMochaRecorder } = Boot(getBootBlueprint());
const configuration = bootMochaRecorder(process);
const { createMochaHooks } = RecorderMocha(createBlueprint(configuration));
export const mochaHooks = createMochaHooks(process, configuration);
