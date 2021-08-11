import {
  buildDependenciesAsync,
  buildComponentAsync,
  buildComponentsAsync,
} from "../build/component/dynamic.mjs";

const generate = (buildAsync) => (specifier, blueprint) =>
  buildAsync("test", specifier, {
    log: "off",
    ...blueprint,
  });

export const buildTestDependenciesAsync = generate(buildDependenciesAsync);
export const buildTestComponentsAsync = generate(buildComponentsAsync);
export const buildTestComponentAsync = generate(buildComponentAsync);
