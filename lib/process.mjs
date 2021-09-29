import Boot from "../dist/node-boot.mjs";
import RecorderProcess from "../dist/node-recorder-process.mjs";
import { getBootBlueprint, createBlueprint } from "./blueprint.mjs";

const { bootProcessRecorder } = Boot(getBootBlueprint());
const configuration = bootProcessRecorder(process);
const {mainAsync} = RecorderProcess(createBlueprint(configuration));
mainAsync(process, configuration);
export * from "./loader.mjs";
