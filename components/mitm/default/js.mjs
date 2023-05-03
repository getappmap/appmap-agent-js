import { sendBackend } from "../../backend/index.mjs";
import { readFile } from "../../file/index.mjs";
import { instrumentInject } from "../../instrumentation-inject/index.mjs";

export const instrumentJs = (configuration, backend, { url, content }) => {
  const { sources, content: instrumented_content } = instrumentInject(
    url,
    content,
    configuration,
    readFile,
  );
  for (const { url, content } of sources) {
    sendBackend(backend, {
      type: "source",
      url,
      content,
    });
  }
  return instrumented_content;
};
