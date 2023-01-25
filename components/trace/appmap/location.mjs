import { sanitizePathFilename } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";

const { encodeURIComponent } = globalThis;

const pickBasename = ({ appmap_file: basename, "map-name": name }) => {
  if (basename !== null) {
    return basename;
  } else if (name !== null) {
    return name;
  } else {
    return "anonymous";
  }
};

export const getLocationUrl = (configuration) =>
  toAbsoluteUrl(
    `${configuration.recorder}/${encodeURIComponent(
      sanitizePathFilename(`${pickBasename(configuration)}.appmap.json`),
    )}`,
    configuration.appmap_dir,
  );
