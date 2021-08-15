/* global APPMAP_TRANSFORM_SOURCE */

import { runInThisContext } from "vm";

export let transformSource = null;

// There is at least one case where this file gets loaded multiple times:
// Sometimes npx will fake spawn its command into its own process.
// Hence, we must check for already defined
if (typeof APPMAP_TRANSFORM_SOURCE === "undefined") {
  runInThisContext("let APPMAP_TRANSFORM_SOURCE = null;");
  transformSource = (content, context, transformSource) => {
    if (APPMAP_TRANSFORM_SOURCE !== null) {
      return APPMAP_TRANSFORM_SOURCE(content, context, transformSource);
    }
    return transformSource(content, context, transformSource);
  };
} else {
  transformSource = (content, context, transformSource) => transformSource(content, context, transformSource);
}
