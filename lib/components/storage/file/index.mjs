import { writeFileSync } from "fs";
import { writeFile } from "fs/promises";

const { stringify: global_JSON_stringify } = JSON;
const global_Map = Map;
const global_String = String;

const getName = (versioning, name, postfix) => {
  if (versioning.has(name)) {
    const counter = versioning.get(name);
    versioning.set(name, counter + 1);
    name = `${name}-${global_String(counter)}`;
  } else {
    versioning.set(name, 1);
  }
  return `${name}${postfix}.json`;
};

export default (dependencies) => {
  const {
    Expect: { expectSuccess, expectSuccessAsync },
  } = dependencies;
  return {
    createStorage: (options) => ({
      directory: "tmp/appmap",
      indent: 0,
      postfix: "",
      ...options,
      versioning: new global_Map(),
    }),
    store: ({ directory, indent, postfix, versioning }, name, data) =>
      expectSuccess(
        () =>
          writeFileSync(
            `${directory}/${getName(versioning, name, postfix)}`,
            global_JSON_stringify(data, null, indent),
            "utf8",
          ),
        "failed to save appmap to %s >> %e",
        name,
      ),
    storeAsync: ({ directory, indent, postfix, versioning }, name, data) =>
      expectSuccessAsync(
        writeFile(
          `${directory}/${getName(versioning, name, postfix)}`,
          global_JSON_stringify(data, null, indent),
          "utf8",
        ),
        "failed to asynchronously save appmap to %s",
        name,
      ),
  };
};
