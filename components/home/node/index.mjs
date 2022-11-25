import { toAbsoluteUrl } from "../../url/index.mjs";

// Consistent way to retreive home url in prod and test.
// Indeed, components are bundled and import.meta.url will be in dist at prod.
// However both test and prod import.meta.url are inside home.

let { url } = import.meta;

while (!url.endsWith("appmap-agent-js/")) {
  url = toAbsoluteUrl("..", url);
}

export const home = url;
