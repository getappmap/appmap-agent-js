import { createHash } from "node:crypto";
import {
  rm as rmAsync,
  readdir as readdirAsync,
  stat as statAsync,
} from "node:fs/promises";

const {
  Promise,
  URL,
  Object: { entries: toEntries },
  JSON: { stringify: stringifyJSON },
} = globalThis;

const BUNDLE_DIRNAME = "dist/bundles";
const COMPONENT_DIRNAME = "components";
const COMPONENT_FILENAME = "index.mjs";
const INSTANCE_FILENAME = "index.mjs";
const ESLINTRC_FILENAME = ".eslintrc.json";
const SUPPORT_FILENAME = ".env";
const PARAMS_FILENAME = "params.mjs";

const isNotNull = (any) => any !== null;

const readDirnameArrayAsync = async (directory) =>
  (
    await Promise.all(
      (
        await readdirAsync(directory)
      ).map(async (filename) =>
        (await statAsync(new URL(filename, directory))).isDirectory()
          ? filename
          : null,
      ),
    )
  ).filter(isNotNull);

const compareEntry = ([key1], [key2]) => key1.localeCompare(key2);

export const hashBundle = (component, params) => {
  const entries = toEntries(params);
  entries.sort(compareEntry);
  const hash = createHash("sha256");
  hash.update(stringifyJSON([component, entries]), "utf8");
  return hash.digest().toString("hex");
};

export const readComponentArrayAsync = (home) =>
  readDirnameArrayAsync(new URL(`${COMPONENT_DIRNAME}/`, home));

export const readInstanceArrayAsync = (home, component) =>
  readDirnameArrayAsync(new URL(`${COMPONENT_DIRNAME}/${component}/`, home));

export const clearBundleCache = async (home) =>
  await rmAsync(new URL(BUNDLE_DIRNAME, home), {
    recursive: true,
    force: true,
  });

export const getBundleUrl = (home, component, params) =>
  new URL(`${BUNDLE_DIRNAME}/${hashBundle(component, params)}.mjs`, home);

export const getParamsUrl = (home) =>
  new URL(`${COMPONENT_DIRNAME}/${PARAMS_FILENAME}`, home);

export const getInstanceEslintUrl = (home, component, instance) =>
  new URL(
    `${COMPONENT_DIRNAME}/${component}/${instance}/${ESLINTRC_FILENAME}`,
    home,
  );

export const getInstanceSupportUrl = (home, component, instance) =>
  new URL(
    `${COMPONENT_DIRNAME}/${component}/${instance}/${SUPPORT_FILENAME}`,
    home,
  );

export const getComponentMainUrl = (home, component) =>
  new URL(`${COMPONENT_DIRNAME}/${component}/${COMPONENT_FILENAME}`, home);

export const getInstanceMainUrl = (home, component, instance) =>
  new URL(
    `${COMPONENT_DIRNAME}/${component}/${instance}/${INSTANCE_FILENAME}`,
    home,
  );

export const getInstanceMainRelativeUrl = (_home, _component, instance) =>
  `./${instance}/${INSTANCE_FILENAME}`;
