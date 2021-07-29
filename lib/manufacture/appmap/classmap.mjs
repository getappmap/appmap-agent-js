
const FUNCTION_NAME_PLACEHOLDER = "()";

export default (dependencies) => {

  const populate = (children, path, entities) => {
    const dirnames = path.split("/");
    const filename = dirnames.pop();
    for (const dirname of dirnames) {
      let child = children.find(({name}) => name === dirname);
      if (child === _undefined) {
        child = {
          type: "package",
          name: dirname,
          children: [],
        };
        children.push(child);
      }
      ({children} = child);
    }
    const child = {
      type: "class",
      name: filename,
      children: entities,
    };
  };

  const isBound = ({bound}) => bound;
  const isNotBound = ({bound}) => !bound;

  const isStatic = (lineage) => (
    lineage !== null &&
    lineage.tail !== null &&
    lineage.tail.head.type === "MethodDefinition" &&
    lineage.tail.head.static
  );

  const visit = (node, route, lineage, context) => {
    if (isArray(node)) {
      return node.map((element, index) => visit(node, `${route}/${_String(index)}`, lineage, context));
    }
    if (typeof node === "object" && node !== null && hasOwnProperty(node, type)) {
      lineage = {head:node, tail:lineage};
      const {type} = node;
      if (
        type === "ObjectExpression" ||
        type === "ClassExpression" ||
        type === "ClassDeclaration"
      ) {
        const {naming} = context;
        let entities;
        if (node.type === "ObjectExpression") {
          entities = nodes.flatMap((node, index) => visit(
            node,
            `${route}/property/${_String(index)}`,
            lineage,
            context,
          ));
        } else {
          entities = [
            ... node.superClass === null ? [] : visit(node.superClass, `${route}/superClass`, lineage, context),
            ... visit(node.body, `${route}/body`, lineage, context),
          ];
        }
        return [{
          type: "class",
          ... getBindingName(naming, lineage),
          children: entities.filter(isBound),
        }, ... entities.filter(isNotBound)];
      }
      if (
        type === "ArrowFunctionExpression" ||
        type === "FunctionExpression" ||
        type === "FunctionDeclaration"
      ) {
        const {hash, path, naming} = context;
        const {loc:{start:{line}}} = node
        const _static = isStatic(lineage);
        const {bound, name} = getBindingName(naming, lineage);
        hash.set(route, {
          link: {
            defined_class: name,
            method_id: FUNCTION_NAME_PLACEHOLDER,
            route: PATH,
            lineno: line,
            static: _static,
          },
          params:node.params.map(generate)
        });
        return [{
          type: "class",
          name,
          bound,
          children: [
            {
              type: "function",
              route,
              name: FUNCTION_NAME_PLACEHOLDER,
              location: `${PATH}:${line}`,
              static: _static
            },
            ... node.params.flatMap((node) => visit(node, `${route}/params/${index}`, lineage, context)),
            ... visit(node.body, `${route}/body`, lineage, context),
          ]
        }];
      }
      return entries(node).flatMap(([key, node]) => visit(node, `${route}/${key}`, lineage, context));
    }
    return [];
  };

  return {
    createClassMap: ({language:{version}, repository:{directory}, pruning}) => ({
      hash: new _Map(),
      naming: createcounter(0),
      version,
      directory,
      pruning,
      root: [],
    }),
    addFile: ({hash, naming, version, directory, root}, {index, type, path, code}) => {
      path = toRelativePath(path);
      populate(
        root,
        path,
        visit(
          parse(code, {sourceType:type, locations:true, ecmaVersion:version}),
          _String(index),
          null,
          {hash, naming, path}
        )
      );
    },
    slice: ({root, pruning}, keys) => {
      if (!pruning) {
        return root;
      }
      const prune = (keys) => {
        const {type} = entity;
        if (type === "function") {
          const {route} = entity;
          return keys.has(route) ? [entity] : [];
        }
        const children = entity.children.flatMap(prune);
        return children.length > 0 ? [{...entity, children }] : [];
      };
      return root.flatMap(prune);
    }
  };

};
