/* globals URL */

import Estree from "./estree/index.mjs";
import Exclusion from "./exclusion.mjs";

const _Set = Set;
const _Map = Map;
const _URL = URL;
const _undefined = undefined;
const { from: toArray } = Array;

export default (dependencies) => {
  const {
    util: { assert, createCounter, toRelativePath },
    log: { logWarning, logDebug },
    location: {
      makeLocation,
      parseLocation,
      stringifyLocation,
      incrementLocationColumn,
    },
  } = dependencies;
  const { createExclusion, isExcluded } = Exclusion(dependencies);
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
  const { extractEstreeEntityArray } = Estree(dependencies);
  const generateCutContent =
    (content) =>
    ([start, end]) =>
      content.substring(start, end);
  const excludeEntity = (entity, parent, exclusion, excluded) => {
    if (isExcluded(exclusion, entity, parent)) {
      excluded.push(entity);
      return [];
    }
    return [
      {
        ...entity,
        children: entity.children.flatMap((child) =>
          excludeEntity(child, entity, exclusion, excluded),
        ),
      },
    ];
  };
  const registerExcludedEntityArray = (entities, { url }, closures) => {
    const registerExcludedEntity = (entity) => {
      const { type, children } = entity;
      if (type === "function") {
        const { line, column } = entity;
        closures.set(stringifyLocation(makeLocation(url, line, column)), null);
      }
      children.forEach(registerExcludedEntity);
    };
    entities.forEach(registerExcludedEntity);
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
          shallow: shallow,
          link: {
            method_id: placeholder,
            path: path,
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
    const isEntityCalled = (entity) =>
      entity.type !== "function" ||
      callees.has(
        stringifyLocation(makeLocation(url, entity.line, entity.column)),
      );
    const filterCalledEntityChildren = (entity) => ({
      ...entity,
      children: entity.children
        .filter(isEntityCalled)
        .map(filterCalledEntityChildren),
    });
    return entities.filter(isEntityCalled).map(filterCalledEntityChildren);
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

  return {
    createClassmap: ({
      "function-name-placeholder": placeholder,
      repository: { directory },
      pruning,
    }) => ({
      placeholder,
      closures: new _Map(),
      sources: [],
      urls: new _Set(),
      naming: {
        counter: createCounter(0),
        separator: "-",
      },
      directory,
      pruning,
    }),
    addClassmapSource: (
      {
        pruning,
        closures,
        urls,
        naming,
        directory,
        root,
        placeholder,
        sources,
      },
      { url, content, inline, exclude, shallow },
    ) => {
      assert(!urls.has(url), "duplicate source url");
      urls.add(url);
      const { pathname } = new _URL(url);
      const path = toRelativePath(directory, pathname);
      const context = { url, path, shallow, inline, content, placeholder };
      const exclusion = createExclusion(exclude);
      const excluded = [];
      let entities = extractEstreeEntityArray(path, content, naming).flatMap(
        (entity) => excludeEntity(entity, null, exclusion, excluded),
      );
      registerExcludedEntityArray(excluded, context, closures);
      registerEntityArray(entities, context, closures);
      if (pruning) {
        entities = entities.flatMap(cleanupEntity);
      }
      sources.push({ context, entities });
    },
    getClassmapClosure: ({ closures }, url) => {
      if (closures.has(url)) {
        return closures.get(url);
      }
      const next_url = stringifyLocation(
        incrementLocationColumn(parseLocation(url)),
      );
      if (closures.has(next_url)) {
        logDebug(
          "Had to increase column by one to fetch closure information at %j",
          url,
        );
        return closures.get(next_url);
      }
      logWarning(
        "Missing file information for closure at %s, threating it as excluded.",
        url,
      );
      return null;
    },
    compileClassmap: ({ sources, pruning, closures }, urls) => {
      if (pruning) {
        urls = new Set(
          toArray(urls).map((url) =>
            closures.has(url)
              ? url
              : stringifyLocation(incrementLocationColumn(parseLocation(url))),
          ),
        );
        sources = sources.map(({ context, entities }) => ({
          context,
          entities: filterCalledEntityArray(entities, context, urls).flatMap(
            cleanupEntity,
          ),
        }));
      }
      const directories = new Set();
      const root = [];
      for (const { context, entities } of sources.values()) {
        if (!pruning || entities.length > 0) {
          const dirnames = context.path.split("/");
          const filename = dirnames.pop();
          let children = root;
          for (const dirname of dirnames) {
            let child = children.find(
              (child) => child.name === dirname && directories.has(child),
            );
            if (child === _undefined) {
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
      return root;
    },
  };
};
