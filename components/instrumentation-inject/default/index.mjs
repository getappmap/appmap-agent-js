import {
  extractMissingUrlArray,
  instrument,
} from "../../instrumentation/index.mjs";
import { logWarning } from "../../log/index.mjs";

const { Map } = globalThis;

const readFileSafe = (url, readFile) => {
  try {
    return readFile(url);
  } catch (error) {
    logWarning("Could not read file %j >> %O", url, error);
    return null;
  }
};

const readFileSafeAsync = async (url, readFileAsync) => {
  try {
    return await readFileAsync(url);
  } catch (error) {
    logWarning("Could not read file %j >> %O", url, error);
    return null;
  }
};

export const instrumentInject = (url, content, configuration, readFile) => {
  const cache = new Map(content === null ? [] : [[url, content]]);
  while (true) {
    const urls = extractMissingUrlArray(url, cache, configuration);
    if (urls.length === 0) {
      return instrument(url, cache, configuration);
    } else {
      for (const url of urls) {
        cache.set(url, readFileSafe(url, readFile));
      }
    }
  }
};

export const instrumentInjectAsync = async (
  url,
  content,
  configuration,
  readFileAsync,
) => {
  const cache = new Map(content === null ? [] : [[url, content]]);
  while (true) {
    const urls = extractMissingUrlArray(url, cache, configuration);
    if (urls.length === 0) {
      return instrument(url, cache, configuration);
    } else {
      for (const url of urls) {
        cache.set(url, await readFileSafeAsync(url, readFileAsync));
      }
    }
  }
};
