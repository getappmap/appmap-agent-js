import { stat as statAsync } from "fs/promises";
import { hasOwn } from "./util.mjs";
import { getBundleUrl } from "./layout.mjs";
import { writeParamsAsync } from "./params.mjs";
import { routeAsync } from "./route.mjs";

// It would be better to directory try `await import(bundle_url)`.
// But jest intercepts import and will remember it is missing on
// subsequent calls. So updating caching would not be noticed.
const isMissingAsync = async (url) => {
  try {
    await statAsync(url);
    return false;
  } catch (error) {
    if (hasOwn(error, "code") && error.code === "ENOENT") {
      return true;
    } else {
      throw error;
    }
  }
};

export const loadAsync = async (home, component, params) => {
  const url = getBundleUrl(home, component, params);
  if (await isMissingAsync(url)) {
    await writeParamsAsync(home, params);
    await routeAsync(home, params);
    // Dynamic import to make fast track faster
    const { bundleAsync } = await import("./bundle.mjs");
    await bundleAsync(home, component, params);
  }
  return await import(url);
};
