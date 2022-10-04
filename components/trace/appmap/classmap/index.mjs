const {
  Set,
  Map,
  undefined,
  Array: { from: toArray },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { assert, createCounter } = await import(
  `../../../util/index.mjs${__search}`
);
const { pathifyURL } = await import(`../../../url/index.mjs${__search}`);
const { logWarning, logDebug } = await import(
  `../../../log/index.mjs${__search}`
);
const {
  makeLocation,
  parseLocation,
  stringifyLocation,
  incrementLocationColumn,
} = await import(`../../../location/index.mjs${__search}`);
const { extractEstreeEntityArray } = await import(
  `./estree/index.mjs${__search}`
);
const { compileExclusionList, matchExclusionList } = await import(
  `./exclusion-list.mjs${__search}`
);

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

const excludeEntity = (entity, parent, exclusions, excluded_entities) => {
  const { excluded, recursive } = matchExclusionList(
    exclusions,
    entity,
    parent,
  );
  if (excluded && recursive) {
    const exclude = (entity) => {
      excluded_entities.push(entity);
      entity.children.forEach(exclude);
    };
    exclude(entity);
    return [];
  }
  const children = entity.children.flatMap((child) =>
    excludeEntity(child, entity, exclusions, excluded_entities),
  );
  if (excluded && children.length === 0) {
    excluded_entities.push(entity);
    return [];
  }
  return [
    {
      ...entity,
      children,
    },
  ];
};

const registerEntityArray = (
  entities,
  { content, shallow, placeholder, path, url },
  closures,
) => {
  const cutContent = generateCutContent(content);
  const registerEntity = (entity) => {
    const { type, children } = entity;
    if (type === "function") {
      const { line, column, parameters, name, static: _static } = entity;
      closures.set(stringifyLocation(makeLocation(url, line, column)), {
        parameters: parameters.map(cutContent),
        shallow,
        link: {
          method_id: placeholder,
          path,
          lineno: line,
          defined_class: name,
          static: _static,
        },
      });
    }
    children.forEach(registerEntity);
  };
  entities.forEach(registerEntity);
};

const filterCalledEntityArray = (entities, { url }, callees) => {
  const filterCalledEntity = (entity) => {
    const children = entity.children.flatMap(filterCalledEntity);
    return entity.type === "function" &&
      children.length === 0 &&
      !callees.has(
        stringifyLocation(makeLocation(url, entity.line, entity.column)),
      ) &&
      !callees.has(
        stringifyLocation(makeLocation(url, entity.line, entity.column + 1)),
      ) &&
      !callees.has(
        stringifyLocation(makeLocation(url, entity.line, entity.column - 1)),
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
  { placeholder, path, inline, content },
) => {
  const cutContent = generateCutContent(content);
  const compileEntity = (entity) =>
    entity.type === "function"
      ? {
          type: "class",
          name: entity.name,
          children: [
            {
              type: "function",
              name: placeholder,
              location: `${path}:${entity.line}`,
              static: entity.static,
              source: inline ? cutContent(entity.range) : null,
              comment: printCommentArray(entity.comments),
              labels: entity.labels,
            },
            ...entity.children.map(compileEntity),
          ],
        }
      : {
          ...entity,
          children: entity.children.map(compileEntity),
        };
  return entities.map(compileEntity);
};

export const createClassmap = (configuration) => ({
  closures: new Map(),
  sources: [],
  urls: new Set(),
  naming: {
    counter: createCounter(0),
    separator: "-",
  },
  configuration,
});

export const addClassmapSource = (
  {
    closures,
    urls,
    naming,
    configuration: {
      pruning,
      "function-name-placeholder": placeholder,
      repository: { directory },
    },
    sources,
  },
  { url, content, inline, exclude, shallow },
) => {
  assert(!urls.has(url), "duplicate source url");
  urls.add(url);
  const path = pathifyURL(url, directory);
  const context = { url, path, shallow, inline, content, placeholder };
  const exclusions = compileExclusionList(exclude);
  const excluded_entities = [];
  let entities = extractEstreeEntityArray(path, content, naming).flatMap(
    (entity) => excludeEntity(entity, null, exclusions, excluded_entities),
  );
  for (const entity of excluded_entities) {
    const { type } = entity;
    if (type === "function") {
      const { line, column } = entity;
      closures.set(stringifyLocation(makeLocation(url, line, column)), null);
    }
  }
  registerEntityArray(entities, context, closures);
  if (pruning) {
    entities = entities.flatMap(cleanupEntity);
  }
  sources.push({ context, entities });
};

export const getClassmapClosure = ({ closures }, location) => {
  if (closures.has(location)) {
    return closures.get(location);
  }
  const next_location = stringifyLocation(
    incrementLocationColumn(parseLocation(location)),
  );
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
    configuration: { pruning, "collapse-package-hierachy": collapse },
    closures,
  },
  locations,
) => {
  if (pruning) {
    locations = new Set(
      toArray(locations).map((location) =>
        closures.has(location)
          ? location
          : stringifyLocation(incrementLocationColumn(parseLocation(location))),
      ),
    );
    sources = sources.map(({ context, entities }) => ({
      context,
      entities: filterCalledEntityArray(entities, context, locations).flatMap(
        cleanupEntity,
      ),
    }));
  }
  const directories = new Set();
  const root = [];
  if (collapse) {
    for (const { context, entities } of sources.values()) {
      if (
        /* c8 ignore start */ !pruning ||
        entities.length > 0 /* c8 ignore stop */
      ) {
        root.push({
          type: "package",
          name: context.path,
          children: compileEntityArray(entities, context),
        });
      }
    }
  } else {
    for (const { context, entities } of sources.values()) {
      if (
        /* c8 ignore start */ !pruning ||
        entities.length > 0 /* c8 ignore stop */
      ) {
        const dirnames = context.path.split("/");
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
          children: compileEntityArray(entities, context),
        });
      }
    }
  }
  return root;
};
