import { sendBackend } from "../../backend/index.mjs";
import { loadSourceMap, fillSourceMap } from "../../mapping-file/index.mjs";
import { instrument } from "../../instrumentation/index.mjs";

export const instrumentJs = (configuration, backend, source) => {
  const mapping = loadSourceMap(source, null);
  fillSourceMap(mapping, configuration);
  const { content, messages } = instrument(configuration, source, mapping);
  for (const message of messages) {
    sendBackend(backend, message);
  }
  return content;
};
