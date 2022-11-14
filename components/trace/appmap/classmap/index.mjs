const {
  Set,
  Map,
  undefined,
  URL,
  Array: { from: toArray },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { InternalAppmapError } = await import(
  `../../../error/index.mjs${__search}`
);
const { assert, createCounter } = await import(
  `../../../util/index.mjs${__search}`
);
const { toRelativeUrl } = await import(`../../../url/index.mjs${__search}`);
const { logWarning } = await import(`../../../log/index.mjs${__search}`);
const { getLocationPosition, getLocationBase } = await import(
  `../../../location/index.mjs${__search}`
);
const { createSource, compileSource, getSourceClosure } = await import(
  `./source.mjs${__search}`
);

export const createClassmap = (configuration) => ({
  sources: new Map(),
  naming: {
    counter: createCounter(0),
    separator: "-",
  },
  configuration,
});

export const addClassmapSource = (
  {
    naming,
    configuration: {
      "function-name-placeholder": placeholder,
      repository: { directory },
    },
    sources,
  },
  { url, content, inline, exclude: exclusions, shallow },
) => {
  const relative = toRelativeUrl(url, directory);
  assert(
    relative !== null,
    "could not extract relative url",
    InternalAppmapError,
  );
  assert(!sources.has(url), "duplicate source url", InternalAppmapError);
  sources.set(
    url,
    createSource(naming, relative, content, {
      placeholder,
      inline,
      exclusions,
      shallow,
    }),
  );
};

export const getClassmapClosure = ({ sources }, location) => {
  const base = getLocationBase(location);
  if (sources.has(base)) {
    return getSourceClosure(sources.get(base), getLocationPosition(location));
  } else {
    logWarning(
      "Missing source file for closure at %s, threating it as excluded.",
      location,
    );
    return null;
  }
};

export const compileClassmap = (
  {
    sources,
    configuration: {
      pruning,
      "collapse-package-hierachy": collapse,
      repository: { directory },
    },
  },
  locations,
) => {
  const directories = new Set();
  const root = [];
  if (collapse) {
    for (const [url, source] of sources) {
      const relative = toRelativeUrl(url, directory);
      const entities = compileSource(
        source,
        relative,
        toArray(locations)
          .filter((location) => getLocationBase(location) === url)
          .map(getLocationPosition),
        pruning,
      );
      if (
        /* c8 ignore start */ !pruning ||
        entities.length > 0 /* c8 ignore stop */
      ) {
        root.push({
          type: "package",
          name: relative,
          children: entities,
        });
      }
    }
  } else {
    for (const [url, source] of sources) {
      const relative = toRelativeUrl(url, directory);
      const entities = compileSource(
        source,
        relative,
        toArray(locations)
          .filter((location) => getLocationBase(location) === url)
          .map(getLocationPosition),
        pruning,
      );
      if (
        /* c8 ignore start */ !pruning ||
        entities.length > 0 /* c8 ignore stop */
      ) {
        const dirnames = relative.split("/");
        const filename = dirnames.pop();
        let children = root;
        for (const dirname of dirnames) {
          let child = children.find(
            (child) => child.name === dirname && directories.has(child),
          );
          if (child === undefined) {
            child = {
              type: "package",
              name: dirname,
              children: [],
            };
            directories.add(child);
            children.push(child);
          }
          ({ children } = child);
        }
        children.push({
          type: "package",
          name: filename,
          children: entities,
        });
      }
    }
  }
  return root;
};
