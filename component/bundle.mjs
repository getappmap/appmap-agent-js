import { fileURLToPath, pathToFileURL } from "node:url";
import { rollup } from "rollup";
import { getComponentMainUrl, getBundleUrl } from "./layout.mjs";
import { routeAsync } from "./route.mjs";

const isExternal = (specifier, _parent, resolved) => {
  if (resolved) {
    return pathToFileURL(specifier).href.includes("/node_modules/");
  } else {
    return !specifier.startsWith("./") && !specifier.startsWith("../");
  }
};

export const bundleAsync = async (home, component, env, resolution) => {
  await routeAsync(home, env, resolution);
  await (
    await rollup({
      external: isExternal,
      input: fileURLToPath(getComponentMainUrl(home, component)),
    })
  ).write({
    file: fileURLToPath(getBundleUrl(home, component)),
  });
};
