import { sendBackend } from "../../backend/index.mjs";
import { createSource, toSourceMessage } from "../../source/index.mjs";
import { loadSourceMap, fillSourceMap } from "../../mapping-file/index.mjs";
import { instrument } from "../../instrumentation/index.mjs";

export const instrumentJs = (configuration, backend, file) => {
  const source = createSource(file.url, file.content);
  const mapping = loadSourceMap(source, null);
  fillSourceMap(mapping, configuration);
  const { content, sources } = instrument(configuration, source, mapping);
  for (const source of sources) {
    sendBackend(backend, toSourceMessage(source));
  }
  return content;
};
