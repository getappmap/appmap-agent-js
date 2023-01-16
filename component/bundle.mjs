import { fileURLToPath, pathToFileURL } from "node:url";
import { rollup } from "rollup";
import { getComponentMainUrl, getBundleUrl } from "./layout.mjs";
import { routeAsync } from "./route.mjs";

const { URL } = globalThis;

const resolveSpecifier = (specifier, parent, resolved) => {
  if (resolved) {
    const { href } = pathToFileURL(specifier);
    return href;
  } else if (/^[a-zA-Z]+:\/\//u.test(specifier)) {
    return specifier;
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const { href } = new URL(specifier, pathToFileURL(parent));
    return href;
  } else {
    return null;
  }
};

const isExternal = (specifier, parent, resolved) => {
  const maybe_url = resolveSpecifier(specifier, parent, resolved);
  return (
    maybe_url === null || !maybe_url.includes("/appmap-agent-js/components/")
  );
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
