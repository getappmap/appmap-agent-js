const {
  String,
  Set,
  Map,
  undefined,
  URL,
  Array: { from: toArray },
  Math: { abs },
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
const { getLocationPosition, getLocationBase } = await import(
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

const hashPosition = ({ line, column }) => `${String(line)}:${String(column)}`;

const registerEntityArray = (
  entities,
  { content, shallow, placeholder, relative },
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
        hashPosition({ line, column }),
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

const filterCalledEntityArray = (entities, called_positions) => {
  const filterCalledEntity = (entity) => {
    const children = entity.children.flatMap(filterCalledEntity);
    return entity.type === "function" &&
      children.length === 0 &&
      !called_positions.some(
        (called_position) =>
          called_position.line === entity.line &&
          abs(called_position.column - entity.column) < 2,
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
  sources: new Map(),
  naming: {
    counter: createCounter(0),
    separator: "-",
  },
  configuration,
});

export const createSource = (
  naming,
  relative,
  content,
  { placeholder, inline, exclusions, shallow },
) => {
  const entities = visit(parse(relative, content), naming).map((entity) =>
    excludeEntity(entity, null, exclusions),
  );
  const closures = new Map();
  registerEntityArray(
    entities,
    { relative, shallow, content, placeholder },
    closures,
  );
  return {
    closures,
    entities,
    shallow,
    inline,
    content,
    placeholder,
  };
};

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

export const getSourceClosure = (source, position) => {
  const hashed_postion = hashPosition(position);
  if (source.closures.has(hashed_postion)) {
    return source.closures.get(hashed_postion);
  } else {
    const next_position = {
      line: position.line,
      column: position.column + 1,
    };
    const hashed_next_position = hashPosition(next_position);
    if (source.closures.has(hashed_next_position)) {
      logDebug(
        "Had to increase column by one to fetch closure information at %j",
        position,
      );
      return source.closures.get(hashed_next_position);
    } else {
      logWarning(
        "Missing source estree node for closure at %j, threating it as excluded.",
        position,
      );
      return null;
    }
  }
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

const compileSource = (source, relative, positions, pruning) =>
  compileEntityArray(
    pruning
      ? filterCalledEntityArray(source.entities, positions).flatMap(
          cleanupEntity,
        )
      : source.entities,
    {
      relative,
      placeholder: source.placeholder,
      inline: source.inline,
      content: source.content,
    },
  );

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
