/* global APPMAP_TRANSFORM_SOURCE */
import { runInThisContext } from "vm";
runInThisContext("let APPMAP_TRANSFORM_SOURCE = null;");

export const transformSource = (content, context, transformSource) => {
  if (APPMAP_TRANSFORM_SOURCE !== null) {
    return APPMAP_TRANSFORM_SOURCE(content, context, transformSource);
  }
  return transformSource(content, context, transformSource);
};
