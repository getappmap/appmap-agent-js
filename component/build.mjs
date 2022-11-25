import { pathToFileURL } from "node:url";
import process from "node:process";
import minimist from "minimist";
import { clearBundleCache } from "./layout.mjs";
import { writeParamsAsync } from "./params.mjs";
import { checkSignatureAsync } from "./signature.mjs";
import { writeEslintAsync } from "./eslint.mjs";
import { routeAsync } from "./route.mjs";

const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

const options = {
  home: ".",
  eslintrc: false,
  signature: false,
  params: null,
  route: false,
  clear: false,
  bundle: null,
  ...minimist(process.argv.slice(2)),
};

const home = new URL(options.home, `${pathToFileURL(process.cwd())}/`);

if (!home.pathname.endsWith("/")) {
  home.pathname += "/";
}

if (options.eslintrc) {
  await writeEslintAsync(home);
}

if (options.signature) {
  await checkSignatureAsync(home);
}

if (options.params !== null) {
  await writeParamsAsync(home, parseJSON(options.params));
}

if (options.route) {
  await routeAsync(home);
}

if (options.clear) {
  await clearBundleCache(home);
}

if (options.bundle !== null) {
  await (await import("./bundle.mjs")).bundleAsync(home, options.bundle);
}
