/* global APPMAP_TRANSFORM_SOURCE */

import { runInThisContext } from "vm";

export let transformSource = null;

// There is at least one case where this file gets loaded multiple times:
// Sometimes npx will fake spawn its command into its own process.
// Hence, we must check for already defined
if (typeof APPMAP_TRANSFORM_SOURCE_ASYNC === "undefined") {
  runInThisContext("let APPMAP_TRANSFORM_SOURCE_ASYNC = null;");
  transformSource = async (content, context, transformSourceAsync) => {
    if (APPMAP_TRANSFORM_SOURCE_ASYNC !== null) {
      return await APPMAP_TRANSFORM_SOURCE_ASYNC(content, context, transformSourceAsync);
    }
    return await transformSourceAsync(content, context, transformSourceAsync);
  };
} else {
  transformSource = (content, context, transformSourceAsync) =>
    transformSource(content, context, transformSourceAsync);
}
