
import Boot from "../dist/node-boot.mjs";
import ManualRecorder from "../dist/node-recorder-manual.mjs";
import { getBootBlueprint, createBlueprint } from "./blueprint.mjs";

const { cwd } = process;
const { bootManualRecorderAsync } = Boot(getBootBlueprint());

export const createAppmap = (home = cwd(), conf = "appmap.yml", base = cwd()) => {
  if (typeof conf === "string" && conf[0] !== "/") {
    conf = `${cwd()}/${conf}`;
  }
  const configuration = bootManualRecorder(home, conf, base);
  const { Appmap } = ManualRecorder(createBlueprint(configuration));
  return new Appmap(configuration);
}

export const createAppmapAsync = async (home = cwd(), conf = "appmap.yml", base = cwd()) => {
  if (typeof conf === "string" && conf[0] !== "/") {
    conf = `${cwd()}/${conf}`;
  }
  const configuration = await bootManualRecorderAsync(home, conf, base);
  const { Appmap } = ManualRecorder(createBlueprint(configuration));
  return new Appmap(configuration);
};
