import { fileURLToPath, pathToFileURL } from "node:url";
import { rollup } from "rollup";
import { getComponentMainUrl, getBundleUrl } from "./layout.mjs";
import { routeAsync } from "./route.mjs";

const {
  Error,
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { href: internal_prefix } = new URL("../components/", import.meta.url);

const { href: external_prefix } = new URL("../lib/", import.meta.url);

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
  if (maybe_url === null) {
    return true;
  } else if (maybe_url.startsWith(internal_prefix)) {
    return false;
  } else if (maybe_url.startsWith(external_prefix)) {
    return true;
  } else {
    throw new Error(
      `Unexpected resolved url ${stringifyJSON(maybe_url)} from ${stringifyJSON(
        specifier,
      )}`,
    );
  }
};

export const bundleAsync = async (home, name, component, env, resolution) => {
  await routeAsync(home, env, resolution);
  await (
    await rollup({
      external: isExternal,
      input: fileURLToPath(getComponentMainUrl(home, component)),
    })
  ).write({
    file: fileURLToPath(getBundleUrl(home, name)),
  });
};
