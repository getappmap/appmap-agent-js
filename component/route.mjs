import { writeFile as writeFileAsync } from "node:fs/promises";
import {
  readInstanceArrayAsync,
  readComponentArrayAsync,
  getComponentMainUrl,
  getInstanceMainRelativeUrl,
} from "./layout.mjs";
import { readInstanceSupportAsync } from "./support.mjs";

const {
  Promise,
  Error,
  JSON: { stringify: stringifyJSON },
  Reflect: { getOwnPropertyDescriptor },
  Object: { hasOwn = (object, key) => getOwnPropertyDescriptor(object, key) },
} = globalThis;

const lookupInstanceAsync = async (home, component, env, resolution) => {
  const instances = [];
  for (const instance of await readInstanceArrayAsync(home, component)) {
    if (
      (await readInstanceSupportAsync(home, component, instance)).includes(env)
    ) {
      instances.push(instance);
    }
  }
  if (instances.length === 0) {
    return `missing-${env}-instance`;
  } else if (instances.length === 1) {
    if (hasOwn(resolution, component)) {
      throw new Error(
        `there is only a single instance of ${component} available on ${env}, so it is not necessary to specify it in the parameters`,
      );
    } else {
      return instances[0];
    }
  } else {
    if (hasOwn(resolution, component)) {
      if (instances.includes(resolution[component])) {
        return resolution[component];
      } else {
        throw new Error(
          `${resolution[component]} is not an instance of ${component} available on ${env}`,
        );
      }
    } else {
      return `multiple-${env}-instance`;
    }
  }
};

export const routeComponentAsync = async (home, component, env, resolution) => {
  await writeFileAsync(
    getComponentMainUrl(home, component),
    `export * from ${stringifyJSON(
      getInstanceMainRelativeUrl(
        home,
        component,
        await lookupInstanceAsync(home, component, env, resolution),
      ),
    )};`,
    "utf8",
  );
};

export const routeAsync = async (home, env, resolution) => {
  await Promise.all(
    (
      await readComponentArrayAsync(home)
    ).map((component) => routeComponentAsync(home, component, env, resolution)),
  );
};
