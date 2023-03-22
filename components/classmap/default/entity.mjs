import { assert } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import {
  getSourceContent,
  getLeadingCommentArray,
  printComment,
  extractCommentLabelArray,
} from "../../source/index.mjs";
import { toSpecifier, toSpecifierBasename } from "./specifier.mjs";
import { stringifyLoc, parseLoc } from "./loc.mjs";
import { stringifyPosition } from "./position.mjs";

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
          name: toSpecifierBasename(context.url, context.base),
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
  _reference,
  maybe_name,
  children,
  context,
) => {
  const comments = getLeadingCommentArray(node);
  return {
    type: "function",
    reference: stringifyPosition(node.loc.start),
    shallow: context.shallow,
    parameters: node.params.map((param) =>
      getSourceContent(context.source).substring(param.start, param.end),
    ),
    children,
    name: maybe_name ?? context.anonymous,
    location: stringifyLoc(
      toSpecifier(context.url, context.base),
      node.loc.start.line,
    ),
    static: false,
    source: context.inline
      ? getSourceContent(context.source).substring(node.start, node.end)
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

const applyExclude = (entity, parent_entity, recursively_excluded, exclude) => {
  if (recursively_excluded === null) {
    const { excluded, recursive } = exclude(entity, parent_entity);
    return {
      excluded,
      recursively_excluded: recursive ? excluded : null,
    };
  } else {
    return {
      excluded: recursively_excluded,
      recursively_excluded,
    };
  }
};

export const registerEntity = (
  entity,
  maybe_parent_entity,
  recursively_excluded,
  infos,
  exclude,
) => {
  if (entity.type === "function") {
    assert(
      maybe_parent_entity !== null,
      "function entity at root level",
      InternalAppmapError,
    );
    const { excluded, recursively_excluded: child_recursively_excluded } =
      applyExclude(entity, maybe_parent_entity, recursively_excluded, exclude);
    assert(
      !infos.has(entity.reference),
      "duplicate function entity position",
      InternalAppmapError,
    );
    infos.set(
      entity.reference,
      excluded
        ? null
        : {
            parameters: entity.parameters,
            shallow: entity.shallow,
            link: {
              defined_class: maybe_parent_entity.name,
              method_id: entity.name,
              ...parseLoc(entity.location),
              static: entity.static,
            },
          },
    );
    return child_recursively_excluded;
  } else {
    return applyExclude(
      entity,
      maybe_parent_entity,
      recursively_excluded,
      exclude,
    ).recursively_excluded;
  }
};

export const registerEntityTree = (
  entity,
  maybe_parent_entity,
  recursively_excluded,
  infos,
  exclude,
) => {
  const child_recursively_excluded = registerEntity(
    entity,
    maybe_parent_entity,
    recursively_excluded,
    infos,
    exclude,
  );
  for (const child_entity of entity.children) {
    registerEntityTree(
      child_entity,
      entity,
      child_recursively_excluded,
      infos,
      exclude,
    );
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
