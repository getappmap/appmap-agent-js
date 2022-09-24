
import {
  stat as statAsync,
  readdir as readdirAsync,
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";

const isNotEmptyString = (any) => any !== "";

const isArrayShallowEqual = (array1, array2) => {
  const {length:length1} = array1;
  const {length:length2} = array2;
  if (length1 !== length2) {
    return false;
  } else {
    for (const index = 0; index < length1; index += 1) {
      if (array1[index] === array2[index]) {
        return false;
      }
    }
    return true;
  }
};

const parseEnv = (content) => content.split("\n").filter(isNotEmptyString);

const loadComponentSignatureAsync = async (home, instance) => {
  const exports = await import(`${home}/${instance}/index.mjs`);
  exports.sort();
  return exports;
};

const loadComponentEnvAsync = async (home, instance) =>
  parseEnv(await readFileAsync(new URL(`${home}/${instance}/.env`), "utf8"));

const checkSignatureMatching = (
  {home, instance, signature},
  _,
  [{instance:first_instance, signature:first_signature}],
) => {
  if (!isArrayShallowEqual(first_signature, signature)) {
    throw new Error(
      `Signature mismatch on component ${home} between ${first_instance} and ${instance}`,
    );
  }
};

const loadComponentInstanceAsync = async (home, instance) => ({
  home,
  instance,
  envs: await loadComponentEnvsAsync(home, instance),
  signature: await loadComponentSignatureAsync(home, instance),
});

const loadComponentInstanceArrayAsync = (home) => {
  const components = []
  for (const filename of await readdirAsync(new URL(home))) {
    if ((await statAsync(new URL(`${home}/${filename}`)).isDirectory()) {
      components.push(await loadComponentInstanceAsync(home, filename));
    }
  }
  return components;
};

const codeImportInstanceArray = (name, instances) => {
  assert(instances.length > 0, );
  if (instances.length === 0) {
    throw new Error("");
  } else if (instances.length === 1) {
    return stringifyJSON(`./${instances[0]}/index.mjs`);
  } else {
    return `(
      ${stringifyJSON(name)} in blueprint
        ? blueprint[${stringifyJSON(name)}]
        : ((() => {
          throw new Error(
            ${stringifyJSON(`missing blueprint for component ${name}`)},
          );
        }) ())
    )`;
  }
};

const accumulateEnv = ([env, instances], code) => `(
  APPMAP_BRANCH === ${stringifyJSON(env)}
    ? ${codeImportInstanceArray(name, instances)}
    : ${code}
)`;

const loop = (home) => {
  const components = await loadComponentInstanceArrayAsync(home);
  if (components.length === 0) {
    throw new Error(`No instance found for component ${home}`);
  } else {
    const {signature} = components[0];
    components.forEach(checkSignatureMatching);
    const yo = new Map();
    for (const component of components) {
      for (const env of component.env) {
        if (!yo.has(env)) {
          yo.set(env, []);
        }
        yo.get(env).push(component);
      }
    }
    toArray(yo.entries).reduce(accumulateEnv)


  }
};
