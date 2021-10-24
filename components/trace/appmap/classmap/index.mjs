/* globals URL */

import Estree from "./estree/index.mjs";
import Exclusion from "./exclusion.mjs";

const _Set = Set;
const _Map = Map;
const _undefined = undefined;
const _String = String;

export default (dependencies) => {
  const {
    util: { assert, createCounter, toRelativePath },
    log: { logWarning },
  } = dependencies;
  const { createExclusion, isExcluded } = Exclusion(dependencies);
  const printCommentArray = (comments) => {
    const { length } = comments;
    if (length === 0) {
      return null;
    }
    if (length === 1) {
      return comments[0];
    }
    /* c8 ignore start */
    return comments.join("\n");
    /* c8 ignore stop */
  };
  const { extractEstreeEntityArray } = Estree(dependencies);
  const default_closure_information = {
    excluded: true,
    shallow: true,
    parameters: [],
    link: null,
  };
  const transformEntity = (entity, parent, context) => {
    const { type, name, children } = entity;
    const transformChildEntity = (child) =>
      transformEntity(child, entity, context);
    if (type === "class") {
      return {
        type,
        name,
        children: children.map(transformChildEntity),
      };
    }
    if (type === "function") {
      const {
        closures,
        cutContent,
        placeholder,
        shallow,
        path,
        url,
        exclusion,
        inline,
      } = context;
      const {
        parameters,
        labels,
        static: _static,
        comments,
        range,
        line,
        column,
      } = entity;
      closures.set(`${url}#${_String(line)}-${_String(column)}`, {
        parameters: parameters.map(cutContent),
        shallow,
        excluded: isExcluded(
          exclusion,
          parent !== null && parent.type === "class"
            ? `${parent.name}${_static ? "#" : "."}${name}`
            : name,
        ),
        link: {
          method_id: placeholder,
          path,
          lineno: line,
          defined_class: name,
          static: _static,
        },
      });
      return {
        type: "class",
        name,
        children: [
          {
            type: "function",
            name: placeholder,
            location: `${path}:${line}`,
            static: _static,
            source: inline ? cutContent(range) : null,
            comment: printCommentArray(comments),
            labels,
          },
          ...children.map(transformChildEntity),
        ],
      };
    }
    /* c8 ignore start */
    assert(false, "invalid entity type");
    /* c8 ignore stop */
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
      { closures, urls, naming, directory, root, placeholder, sources },
      { url, content, inline, exclude, shallow },
    ) => {
      assert(!urls.has(url), "duplicate source url");
      urls.add(url);
      let { pathname: path } = new URL(url);
      path = toRelativePath(directory, path);
      const cutContent = ([start, end]) => content.substring(start, end);
      sources.push({
        url,
        path,
        entities: extractEstreeEntityArray(path, content, naming).map(
          (entity) =>
            transformEntity(entity, null, {
              closures,
              exclusion: createExclusion(exclude),
              shallow,
              inline,
              url,
              path,
              placeholder,
              cutContent,
            }),
        ),
      });
    },
    getClassmapClosure: ({ closures }, url) => {
      if (closures.has(url)) {
        return closures.get(url);
      }
      logWarning("Missing file information for closure at %s", url);
      return default_closure_information;
    },
    compileClassmap: ({ sources, pruning }, urls) => {
      if (pruning) {
        const whitelist = new Set();
        for (const url of urls) {
          const { protocol, host, pathname } = new URL(url);
          whitelist.add(`${protocol}//${host}${pathname}`);
        }
        sources = sources.filter(({ url }) => whitelist.has(url));
      }
      const directories = new Set();
      const root = [];
      for (const { path, entities } of sources.values()) {
        const dirnames = path.split("/");
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
          children: entities,
        });
      }
      return root;
    },
  };
};
