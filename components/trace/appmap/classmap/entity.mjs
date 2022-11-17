const { URL, String, parseInt } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { assert } = await import(`../../../util/index.mjs${__search}`);
const { getUrlBasename, toAbsoluteUrl } = await import(
  `../../../url/index.mjs${__search}`
);
const { InternalAppmapError } = await import(
  `../../../error/index.mjs${__search}`
);
const { getLeadingCommentArray, printComment, extractCommentLabelArray } =
  await import(`./parse.mjs${__search}`);

const isFunctionEntity = ({ type }) => type === "function";

const printCommentArray = (comments) => {
  const { length } = comments;
  if (length === 0) {
    return null;
  } else {
    return comments.map(printComment).join("\n");
  }
};

///////////////
// Construct //
///////////////

export const wrapRootEntityArray = (entities, context) =>
  entities.some(isFunctionEntity)
    ? [
        {
          type: "class",
          name: getUrlBasename(
            toAbsoluteUrl(context.relative, "protocol://host"),
          ),
          children: entities,
        },
      ]
    : entities;

export const makeClassEntity = (maybe_name, children, context) => ({
  type: "class",
  name: maybe_name ?? context.anonymous,
  children,
});

export const makeFunctionEntity = (
  node,
  reference,
  maybe_name,
  children,
  context,
) => {
  const comments = getLeadingCommentArray(node);
  return {
    type: "function",
    reference,
    shallow: context.shallow,
    parameters: node.params.map((param) =>
      context.content.substring(param.start, param.end),
    ),
    children,
    name: maybe_name ?? context.anonymous,
    location: `${context.relative}:${String(node.loc.start.line)}`,
    static: false,
    source: context.inline
      ? context.content.substring(node.start, node.end)
      : null,
    comment: printCommentArray(comments),
    labels: comments.flatMap(extractCommentLabelArray),
  };
};

export const toStaticFunctionEntity = (entity) => {
  assert(
    entity.type === "function",
    "expected function entity",
    InternalAppmapError,
  );
  return { ...entity, static: true };
};

///////////
// Query //
///////////

export const getEntityName = (entity) => entity.name;

export const getEntityLabelArray = (entity) =>
  entity.type === "function" ? entity.labels : [];

export const getEntityQualifiedName = (entity, maybe_parent_entity) => {
  if (entity.type === "class") {
    return entity.name;
  } else if (entity.type === "function") {
    assert(
      maybe_parent_entity !== null,
      "function entity at root level",
      InternalAppmapError,
    );
    if (maybe_parent_entity.type === "function") {
      return entity.name;
    } else if (maybe_parent_entity.type === "class") {
      return `${maybe_parent_entity.name}${entity.static ? "#" : "."}${
        entity.name
      }`;
    } /* c8 ignore start */ else {
      throw new InternalAppmapError("invalid parent entity type");
    } /* c8 ignore stop */
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid entity type");
  } /* c8 ignore stop */
};

// Used only for testing
export const getEntitySummary = ({ type, name, children }) => ({
  type,
  name,
  children: children.map(getEntitySummary),
});

//////////
// loop //
//////////

export const excludeEntity = (entity, maybe_parent_entity, getExclusion) => {
  const { excluded, recursive } = getExclusion(entity, maybe_parent_entity);
  if (recursive) {
    return excluded ? [] : [entity];
  } else {
    const children = entity.children.flatMap((child_entity) =>
      excludeEntity(child_entity, entity, getExclusion),
    );
    return excluded ? children : [{ ...entity, children }];
  }
};

export const registerFunctionEntity = (entity, maybe_parent_entity, infos) => {
  if (entity.type === "function") {
    assert(
      maybe_parent_entity !== null,
      "function entity at root level",
      InternalAppmapError,
    );
    const parts = /^(.*):([0-9]+)$/u.exec(entity.location);
    assert(
      parts !== null,
      "could not parse function classmap entity location",
      InternalAppmapError,
    );
    assert(
      !infos.has(entity.reference),
      "duplicate function entity reference",
      InternalAppmapError,
    );
    infos.set(entity.reference, {
      parameters: entity.parameters,
      shallow: entity.shallow,
      link: {
        defined_class: maybe_parent_entity.name,
        method_id: entity.name,
        path: parts[1],
        lineno: parseInt(parts[2]),
        static: entity.static,
      },
    });
  }
  for (const child_entity of entity.children) {
    registerFunctionEntity(child_entity, entity, infos);
  }
};

export const hideMissingFunctionEntity = (entity, references) => {
  const children = entity.children.map((child_entity) =>
    hideMissingFunctionEntity(child_entity, references),
  );
  if (entity.type === "function" && !references.has(entity.reference)) {
    return {
      type: "class",
      name: entity.name,
      children,
    };
  } else {
    return {
      ...entity,
      children,
    };
  }
};

export const removeEmptyClassEntity = (entity) => {
  const children = entity.children.flatMap(removeEmptyClassEntity);
  if (entity.type === "class" && children.length === 0) {
    return [];
  } else {
    return [{ ...entity, children }];
  }
};

export const toClassmapEntity = (entity) => {
  const children = entity.children.flatMap(toClassmapEntity);
  if (entity.type === "class") {
    return [
      {
        type: "class",
        name: entity.name,
        children,
      },
    ];
  } else if (entity.type === "function") {
    const {
      shallow: _shallow,
      parameters: _parameters,
      reference: _reference,
      children: _children,
      ...rest
    } = entity;
    return children.length === 0
      ? [rest]
      : [
          rest,
          {
            type: "class",
            name: entity.name,
            children,
          },
        ];
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid entity type");
  } /* c8 ignore stop */
};
