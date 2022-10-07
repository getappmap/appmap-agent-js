import {
  stat as statAsync,
  readdir as readdirAsync,
  readFile as readFileAsync,
  writeFile as writeFileAsync,
  unlink as unlinkAsync,
} from "node:fs/promises";

import { EOL } from "node:os";

import {
  filterAsync,
  isNotEmptyString,
  isArrayShallowEqual,
  makeTrueEntry,
} from "./util.mjs";

import { toEslintEnvs } from "./eslint.mjs";

import { extractExportAsync } from "./export.mjs";

const {
  Set,
  Promise,
  undefined,
  Object: { fromEntries },
  URL,
  Error,
  Math: { max },
  JSON: { stringify: stringifyJSON },
} = globalThis;

const isDirectoryAsync = async (base, url) =>
  (await statAsync(new URL(url, base))).isDirectory();

const parseEnv = (content) => content.split(EOL).filter(isNotEmptyString);

const loadEnvironmentsAsync = async (home, component, instance) => {
  const envs = parseEnv(
    await readFileAsync(new URL(`${component}/${instance}/.env`, home), "utf8"),
  );
  if (new Set(envs).size < envs.length) {
    throw new Error(
      `Duplicate environment entry at ${component}/${instance}/.env`,
    );
  } else {
    const eslint_envs = toEslintEnvs(envs);
    if (eslint_envs.length === 0) {
      try {
        await unlinkAsync(
          new URL(`${component}/${instance}/.eslintrc.json`, home),
        );
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    } else {
      await writeFileAsync(
        new URL(`${component}/${instance}/.eslintrc.json`, home),
        stringifyJSON(
          {
            env: fromEntries(eslint_envs.map(makeTrueEntry)),
          },
          null,
          2,
        ),
        "utf8",
      );
    }
    return envs;
  }
};

const loadSignatureAsync = async (home, component, instance) => {
  const exports = await extractExportAsync(
    new URL(`${component}/${instance}/index.mjs`, home),
  );
  // if (exports.includes("default")) {
  //   throw new Error(
  //     `Detected default export in component ${component}/${instance}`,
  //   );
  // }
  exports.sort();
  return exports;
};

const codeIndexAsync = async (home, component) => {
  const url = new URL(`${component}/`, home);
  const instances = await filterAsync(
    await readdirAsync(url),
    isDirectoryAsync.bind(undefined, url),
  );
  if (instances.length === 0) {
    throw new Error(`No instance found for component ${home}`);
  } else {
    const first_instance = instances[0];
    const first_signature = await loadSignatureAsync(
      home,
      component,
      first_instance,
    );
    const entries = [
      [
        first_instance,
        await loadEnvironmentsAsync(home, component, first_instance),
      ],
    ];
    for (let index = 1; index < instances.length; index += 1) {
      const instance = instances[index];
      const signature = await loadSignatureAsync(home, component, instance);
      if (!isArrayShallowEqual(first_signature, signature)) {
        const padding = max(first_instance.length, instance.length);
        throw new Error(
          [
            `Signature mismatch on component ${component} between:`,
            ` - ${first_instance.padEnd(padding)} >> ${stringifyJSON(
              first_signature,
            )}`,
            ` - ${instance.padEnd(padding)} >> ${stringifyJSON(signature)}`,
          ].join("\n"),
        );
      }
      entries.push([
        instance,
        await loadEnvironmentsAsync(home, component, instance),
      ]);
    }
    return `
      import { selectComponentInstance } from "../loader.mjs";
      const { URL } = globalThis;
      const { search, searchParams: params } = new URL(import.meta.url);
      export const {
        ${first_signature.join(", ")}
      } = await import(\`./\${selectComponentInstance(
        ${stringifyJSON(component)},
        ${stringifyJSON(fromEntries(entries))},
        params,
      )}/index.mjs\${search}\`);
    `;
  }
};

const writeIndexAsync = async (home, filename) => {
  if ((await statAsync(new URL(filename, home))).isDirectory()) {
    await writeFileAsync(
      new URL(`${filename}/index.mjs`, home),
      await codeIndexAsync(home, filename),
      "utf8",
    );
  }
};

const home = new URL(`../../components/`, import.meta.url);

await Promise.all(
  (
    await readdirAsync(new URL(home))
  ).map((filename) => writeIndexAsync(home, filename)),
);
