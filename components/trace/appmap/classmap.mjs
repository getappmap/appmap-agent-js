import { parse } from "acorn";
import { generate } from "escodegen";

const { entries } = Object;
const _Map = Map;
const _undefined = undefined;
const _String = String;
const { isArray } = Array;

export default (dependencies) => {
  const {
    util: { assert, createCounter, toRelativePath, hasOwnProperty },
    naming: { parseQualifiedName, getQualifiedName },
  } = dependencies;

  const populate = (children, path, entities) => {
    const dirnames = path.split("/");
    const filename = dirnames.pop();
    for (const dirname of dirnames) {
      let child = children.find(
        ({ directory, name }) => directory && name === dirname,
      );
      if (child === _undefined) {
        child = {
          type: "package",
          directory: true,
          name: dirname,
          children: [],
        };
        children.push(child);
      }
      ({ children } = child);
    }
    children.push({
      type: "package",
      directory: false,
      name: filename,
      children: entities,
    });
  };

  const cleanupPackage = ({ type, directory, name, children }) => ({
    type,
    name,
    children: directory
      ? children.map(cleanupPackage)
      : children.map(cleanupOther),
  });

  const cleanupOther = (entity) => {
    const { type } = entity;
    if (type === "function") {
      /* eslint-disable no-unused-vars */
      const { route, ...rest } = entity;
      /* eslint-enable no-unused-vars */
      return rest;
    }
    assert(type === "class", "invalid entity type");
    const { name, children } = entity;
    return {
      type,
      name,
      children: children.map(cleanupOther),
    };
  };

  const isBound = ({ bound }) => bound;
  const isNotBound = ({ bound }) => !bound;

  const visit = (node, route, lineage, context) => {
    if (isArray(node)) {
      return node.flatMap((element, index) =>
        visit(element, `${route}/${_String(index)}`, lineage, context),
      );
    }
    if (
      typeof node === "object" &&
      node !== null &&
      hasOwnProperty(node, "type")
    ) {
      lineage = { head: node, tail: lineage };
      const { hash, path, naming, exclude, placeholder } = context;
      const qualified_name = getQualifiedName(naming, lineage);
      if (qualified_name !== null && exclude.has(qualified_name)) {
        return [];
      }
      const { type } = node;
      if (
        type === "ObjectExpression" ||
        type === "ClassExpression" ||
        type === "ClassDeclaration"
      ) {
        assert(qualified_name !== null, "missing name for object/class node");
        let entities;
        if (node.type === "ObjectExpression") {
          entities = node.properties.flatMap((node, index) =>
            visit(
              node,
              `${route}/properties/${_String(index)}`,
              lineage,
              context,
            ),
          );
        } else {
          entities = [
            ...(node.superClass === null
              ? []
              : visit(
                  node.superClass,
                  `${route}/superClass`,
                  lineage,
                  context,
                )),
            ...visit(node.body, `${route}/body`, lineage, context),
          ];
        }
        const { qualifier, name } = parseQualifiedName(qualified_name);
        return [
          {
            type: "class",
            name,
            children: entities.filter(isBound),
            bound: qualifier !== null,
          },
          ...entities.filter(isNotBound),
        ];
      }
      if (
        type === "ArrowFunctionExpression" ||
        type === "FunctionExpression" ||
        type === "FunctionDeclaration"
      ) {
        assert(qualified_name !== null, "missing name for function/arrow node");
        const {
          loc: {
            start: { line },
          },
        } = node;
        const {
          qualifier,
          name,
          static: _static,
        } = parseQualifiedName(qualified_name);
        hash.set(route, {
          link: {
            defined_class: name,
            method_id: placeholder,
            path,
            lineno: line,
            static: _static,
          },
          parameters: node.params.map(generate),
        });
        return [
          {
            type: "class",
            name,
            bound: qualifier !== null,
            children: [
              {
                type: "function",
                name: placeholder,
                location: `${path}:${line}`,
                static: _static,
                labels: [],
                comment: null,
                source: null,
                route,
              },
              ...node.params.flatMap((node, index) =>
                visit(node, `${route}/params/${index}`, lineage, context),
              ),
              ...visit(node.body, `${route}/body`, lineage, context),
            ],
          },
        ];
      }
      return entries(node).flatMap(([key, node]) =>
        visit(node, `${route}/${key}`, lineage, context),
      );
    }
    return [];
  };

  return {
    createClassmap: ({
      "function-name-placeholder": placeholder,
      language: { version },
      repository: { directory },
      pruning,
    }) => ({
      placeholder,
      hash: new _Map(),
      naming: createCounter(0),
      version,
      directory,
      pruning,
      root: [],
    }),
    addClassmapFile: (
      { hash, naming, version, directory, root, placeholder },
      { index, exclude, type, path, code },
    ) => {
      path = toRelativePath(directory, path);
      populate(
        root,
        path,
        visit(
          parse(code, {
            sourceType: type,
            locations: true,
            ecmaVersion: version,
          }),
          _String(index),
          null,
          { hash, exclude: new Set(exclude), naming, path, placeholder },
        ),
      );
    },
    getClassmapInfo: ({ hash }, route) => hash.get(route),
    compileClassmap: ({ root, pruning }, keys) => {
      if (!pruning) {
        return root.map(cleanupPackage);
      }
      const prune = (entity) => {
        const { type } = entity;
        if (type === "function") {
          const { route } = entity;
          return keys.has(route) ? [entity] : [];
        }
        const children = entity.children.flatMap(prune);
        return children.length > 0 ? [{ ...entity, children }] : [];
      };
      return root.flatMap(prune).map(cleanupPackage);
    },
  };
};
