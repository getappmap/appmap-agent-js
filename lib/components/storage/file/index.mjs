import { writeFileSync } from "fs";
import { writeFile } from "fs/promises";

const getName = (versioning, name) => {
  if (versioning.has(name)) {
    const counter = versioning.get(name);
    versioning.set(name, counter + 1);
    name = `${name}-${String(counter)}`;
  } else {
    versioning.set(name, 1);
  }
  return `${name}.appmap.json`;
};

export default (dependencies, configuration) => {
  let { directory, indent } = {
    directory: "tmp/appmap",
    indent: 0,
    ...configuration,
  };
  if (!directory.endsWith("/")) {
    directory = `${directory}/`;
  }
  const versioning = new Map();
  return {
    store: (name, data) =>
      writeFileSync(
        `${directory}${getName(versioning, name)}`,
        JSON.stringify(data, null, indent),
        "utf8",
      ),
    storeAsync: (name, data) =>
      writeFile(
        `${directory}${getName(versioning, name)}`,
        JSON.stringify(data, null, indent),
        "utf8",
      ),
  };
};
