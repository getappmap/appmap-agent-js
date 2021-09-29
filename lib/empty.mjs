import Boot from "../dist/node-boot.mjs";
import RecorderEmpty from "../dist/node-recorder-empty.mjs";
import { getBootBlueprint, createBlueprint } from "./blueprint.mjs";

const { bootEmptyRecorder } = Boot(getBootBlueprint());
const configuration = bootEmptyRecorder(process);
const {mainAsync} = RecorderEmpty(createBlueprint(configuration));
mainAsync(process, configuration);
export * from "./loader.mjs";
