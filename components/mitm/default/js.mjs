import { sendBackend } from "../../backend/index.mjs";
import { readFile } from "../../file/index.mjs";
import {
  extractMissingUrlArray,
  instrument,
} from "../../instrumentation/index.mjs";

const { Map } = globalThis;

export const instrumentJs = (configuration, backend, { url, content }) => {
  const cache = new Map([[url, content]]);
  let complete = false;
  while (!complete) {
    const urls = extractMissingUrlArray(url, cache, configuration);
    if (urls.length === 0) {
      complete = true;
    } /* c8 ignore start */ else {
      for (const url of urls) {
        cache.set(url, readFile(url));
      }
    } /* c8 ignore stop */
  }
  const { content: instrumented_content, messages } = instrument(
    url,
    cache,
    configuration,
  );
  for (const message of messages) {
    sendBackend(backend, message);
  }
  return instrumented_content;
};
