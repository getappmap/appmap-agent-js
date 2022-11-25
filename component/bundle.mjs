import { fileURLToPath } from "node:url";
import { rollup } from "rollup";
import { hasOwn } from "./util.mjs";
import { getComponentMainUrl, getBundleUrl } from "./layout.mjs";
import { readParamsAsync } from "./params.mjs";

const { Error, undefined } = globalThis;

const handleWarning = (warning, handleWarningDefault) => {
  if (
    typeof warning !== "object" ||
    warning === null ||
    !hasOwn(warning, "code") ||
    warning.code !== "UNRESOLVED_IMPORT"
  ) {
    handleWarningDefault(warning);
    throw new Error("unexpected warning");
  }
};

export const bundleAsync = async (home, component, params) => {
  if (params === undefined) {
    params = await readParamsAsync(home, component);
  }
  await (
    await rollup({
      onwarn: handleWarning,
      input: fileURLToPath(getComponentMainUrl(home, component)),
    })
  ).write({
    file: fileURLToPath(getBundleUrl(home, component, params)),
  });
};
