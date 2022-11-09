const {
  Set,
  Map,
  undefined,
  Array: { from: toArray },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { InternalAppmapError } = await import(
  `../../../error/index.mjs${__search}`
);
const { assert, createCounter } = await import(
  `../../../util/index.mjs${__search}`
);
const { toRelativeUrl } = await import(`../../../url/index.mjs${__search}`);
const { logWarning, logDebug } = await import(
  `../../../log/index.mjs${__search}`
);
const { makeLocation, getLocationPosition } = await import(
  `../../../location/index.mjs${__search}`
);
const { excludeEntity } = await import(`./exclusion.mjs${__search}`);
const { parse } = await import(`./parse.mjs${__search}`);
const { visit } = await import(`./visit.mjs${__search}`);

const printCommentArray = (comments) => {
  /* c8 ignore start */
  const { length } = comments;
  if (length === 0) {
    return null;
  }
  if (length === 1) {
    return comments[0];
  }
  return comments.join("\n");
  /* c8 ignore stop */
};

const generateCutContent =
  (content) =>
  ([start, end]) =>
    content.substring(start, end);

const registerEntityArray = (
  entities,
  { content, shallow, placeholder, relative, url },
  closures,
) => {
  const cutContent = generateCutContent(content);
  const registerEntity = (entity) => {
    const { type, children } = entity;
    if (type === "function") {
      const {
        excluded,
        line,
        column,
        parameters,
        name,
        static: _static,
      } = entity;
      closures.set(
        makeLocation(url, { line, column }),
        excluded
          ? null
          : {
              parameters: parameters.map(cutContent),
              shallow,
              link: {
                method_id: placeholder,
                path: relative,
                lineno: line,
                defined_class: name,
                static: _static,
              },
            },
      );
    }
    children.forEach(registerEntity);
  };
  entities.forEach(registerEntity);
};

const filterCalledEntityArray = (entities, url, callees) => {
  const filterCalledEntity = (entity) => {
    const children = entity.children.flatMap(filterCalledEntity);
    return entity.type === "function" &&
      children.length === 0 &&
      !callees.has(
        makeLocation(url, { line: entity.line, column: entity.column }),
      ) &&
      !callees.has(
        makeLocation(url, { line: entity.line, column: entity.column + 1 }),
      ) &&
      !callees.has(
        makeLocation(url, { line: entity.line, column: entity.column - 1 }),
      )
      ? []
      : [
          {
            ...entity,
            children,
          },
        ];
  };
  return entities.flatMap(filterCalledEntity);
};

const cleanupEntity = (entity) => {
  const children = entity.children.flatMap(cleanupEntity);
  return entity.type === "function" || children.length > 0
    ? [{ ...entity, children }]
    : [];
};

const compileEntityArray = (
  entities,
  { placeholder, relative, inline, content },
) => {
  const cutContent = generateCutContent(content);
  const compileEntity = (entity) => {
    const children = entity.children.flatMap(compileEntity);
    if (entity.excluded) {
      return children;
    } else if (entity.type === "function") {
      return {
        type: "class",
        name: entity.name,
        children: [
          {
            type: "function",
            name: placeholder,
            location: `${relative}:${entity.line}`,
            static: entity.static,
            source: inline ? cutContent(entity.range) : null,
            comment: printCommentArray(entity.comments),
            labels: entity.labels,
          },
          ...children,
        ],
      };
    } else if (entity.type === "class") {
      return {
        type: "class",
        name: entity.name,
        children,
      };
    } /* c8 ignore start */ else {
      throw new InternalAppmapError("invalid entity type");
    } /* c8 ignore stop */
  };
  return entities.flatMap(compileEntity);
};

export const createClassmap = (configuration) => ({
  closures: new Map(),
  sources: new Map(),
  naming: {
    counter: createCounter(0),
    separator: "-",
  },
  configuration,
});

export const addClassmapSource = (
  {
    closures,
    naming,
    configuration: {
      pruning,
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
  let entities = visit(parse(relative, content), naming).map((entity) =>
    excludeEntity(entity, null, exclusions),
  );
  registerEntityArray(
    entities,
    { url, relative, shallow, content, placeholder },
    closures,
  );
  if (pruning) {
    entities = entities.flatMap(cleanupEntity);
  }
  assert(!sources.has(url), "duplicate source url", InternalAppmapError);
  sources.set(url, {
    entities,
    shallow,
    inline,
    content,
    placeholder,
  });
};

export const getClassmapClosure = ({ closures }, location) => {
  if (closures.has(location)) {
    return closures.get(location);
  }
  const { line, column } = getLocationPosition(location);
  const next_location = makeLocation(location, {
    line,
    column: column + 1,
  });
  if (closures.has(next_location)) {
    logDebug(
      "Had to increase column by one to fetch closure information at %j",
      location,
    );
    return closures.get(next_location);
  }
  logWarning(
    "Missing file information for closure at %s, threating it as excluded.",
    location,
  );
  return null;
};

export const compileClassmap = (
  {
    sources,
    configuration: {
      pruning,
      "collapse-package-hierachy": collapse,
      repository: { directory },
    },
    closures,
  },
  locations,
) => {
  if (pruning) {
    locations = new Set(
      toArray(locations).map((location) => {
        if (closures.has(location)) {
          return location;
        } else {
          const { line, column } = getLocationPosition(location);
          return makeLocation(location, { line, column: column + 1 });
        }
      }),
    );
    for (const [url, source] of sources) {
      source.entities = filterCalledEntityArray(
        source.entities,
        url,
        locations,
      ).flatMap(cleanupEntity);
    }
  }
  const directories = new Set();
  const root = [];
  if (collapse) {
    for (const [url, { entities, inline, content, placeholder }] of sources) {
      if (
        /* c8 ignore start */ !pruning ||
        entities.length > 0 /* c8 ignore stop */
      ) {
        const relative = toRelativeUrl(url, directory);
        root.push({
          type: "package",
          name: relative,
          children: compileEntityArray(entities, {
            relative,
            placeholder,
            inline,
            content,
          }),
        });
      }
    }
  } else {
    for (const [url, { entities, inline, content, placeholder }] of sources) {
      if (
        /* c8 ignore start */ !pruning ||
        entities.length > 0 /* c8 ignore stop */
      ) {
        const relative = toRelativeUrl(url, directory);
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
          children: compileEntityArray(entities, {
            relative,
            placeholder,
            inline,
            content,
          }),
        });
      }
    }
  }
  return root;
};
