/* globals APPMAP_TRANSFORM_SOURCE */
import {buildProdAsync} from "../build/index.mjs";
import {runInThisContext} from "vm";

runInThisContext("let APPMAP_TRANSFORM_SOURCE = null;");

export const transformSource = (content, context, transformSource) => {
  if (APPMAP_TRANSFORM_SOURCE !== null) {
    return APPMAP_TRANSFORM_SOURCE(content, context, transformSource);
  }
  return transformSource(content, context, transformSource);
};

export const mainAsync = async (blueprint) => {
  const {main:{mainAsync}} = await buildProdAsync(["main"], {
    violation: "exit",
    "interpretation": "node",
    "instrumentation": "default",
    "hook-module": "node",
    "hook-group": "node",
    "hook-query": "node",
    main: "process",
    ... blueprint,
  });
  await mainAsync(process);
};
