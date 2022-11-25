import { hasOwn } from "./util.mjs";
import { getBundleUrl } from "./layout.mjs";
import { writeParamsAsync } from "./params.mjs";
import { routeAsync } from "./route.mjs";

export const loadAsync = async (home, component, params) => {
  const url = getBundleUrl(home, component, params);
  try {
    return await import(url);
  } catch (error) {
    if (!hasOwn(error, "code") || error.code !== "ERR_MODULE_NOT_FOUND") {
      throw error;
    }
  }
  await writeParamsAsync(home, params);
  await routeAsync(home, params);
  // Dynamic import to make fast track faster
  const { bundleAsync } = await import("./bundle.mjs");
  await bundleAsync(home, component, params);
  return await import(url);
};
