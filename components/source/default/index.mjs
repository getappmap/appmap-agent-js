import { getUrlBasename } from "../../url/index.mjs";
import { assert } from "../../util/index.mjs";
import { logWarning } from "../../log/index.mjs";
import { printComment } from "../../parse/index.mjs";
import { lookupPosition, stringifyPosition } from "../../position/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { toEntity } from "./entity.mjs";
import { compileCriteria } from "./criteria.mjs";

const { Map, String } = globalThis;

const getChild = (object, index) => object.children[index];

const hasFunctionType = ({ type }) => type === "function";

const printCommentArray = (comments) => {
  const { length } = comments;
  if (length === 0) {
    return null;
  } else {
    return comments.map(printComment).join("\n");
  }
};

////////////
// Create //
////////////

const registerClosure = (entity, path, closures) => {
  if (entity.type === "closure") {
    closures.set(stringifyPosition(entity.position), path);
  }
  const { length } = entity.children;
  for (let index = 0; index < length; index += 1) {
    registerClosure(
      entity.children[index],
      `${path}/${String(index)}`,
      closures,
    );
  }
};

const registerClosureRoot = (entity) => {
  assert(
    entity.type === "file",
    "root entity should be a file",
    InternalAppmapError,
  );
  const closures = new Map();
  const { length } = entity.children;
  for (let index = 0; index < length; index += 1) {
    registerClosure(entity.children[index], String(index), closures);
  }
  return closures;
};

export const createSource = ({ url, content, program }) => {
  const entity = toEntity(program, getUrlBasename(url));
  return {
    url,
    content,
    program,
    root: entity,
    closures: registerClosureRoot(entity),
  };
};

/////////////
// Exclude //
/////////////

const excludeEntityDeeply = (entity, excluded) => {
  entity.excluded = excluded;
  for (const child of entity.children) {
    excludeEntityDeeply(child, excluded);
  }
};

const excludeEntity = (entity, parent, exclude) => {
  const { excluded, recursive } = exclude(entity, parent);
  if (recursive) {
    excludeEntityDeeply(entity, excluded);
  } else {
    entity.excluded = excluded;
    for (const child of entity.children) {
      excludeEntity(child, entity, exclude);
    }
  }
};

export const applyExclusionCriteria = ({ root }, criteria) => {
  excludeEntity(root, null, compileCriteria(criteria));
};

///////////
// Query //
///////////

export const resolveClosurePosition = ({ url, root, closures }, position) => {
  const pair = lookupPosition(closures, position);
  if (pair === null) {
    logWarning(
      "Could find a closure at %j in %j, treating it as excluded",
      position,
      url,
    );
    return null;
  } else {
    const [resolved_position, path] = pair;
    return path.split("/").reduce(getChild, root).excluded
      ? null
      : resolved_position;
  }
};

export const lookupClosurePosition = (
  { url, root, closures, content },
  position,
) => {
  const pair = lookupPosition(closures, position);
  if (pair === null) {
    logWarning(
      "Could find a closure at %j in %j, treating it as excluded",
      position,
      url,
    );
    return null;
  } else {
    let parent = null;
    let entity = root;
    for (const index of pair[1].split("/")) {
      parent = entity;
      entity = entity.children[index];
    }
    if (entity.excluded) {
      return null;
    } else {
      entity.used = true;
      return {
        position: entity.position,
        parameters: entity.parameters.map(({ start, end }) =>
          content.substring(start, end),
        ),
        parent: parent.name,
        name: entity.name,
        static: entity.static,
      };
    }
  }
};

////////////
// Digest //
////////////

const digestEntity = (entity, context) => {
  const children = entity.children.flatMap((child) =>
    digestEntity(child, context),
  );
  if (entity.excluded) {
    return children;
  } else {
    if (entity.type === "file") {
      if (children.some(hasFunctionType)) {
        return [
          {
            type: "class",
            name: entity.name,
            children,
          },
        ];
      } else {
        return children;
      }
    } else if (entity.type === "class") {
      if (children.length === 0 && context.pruning) {
        return [];
      } else {
        return [
          {
            type: "class",
            name: entity.name,
            children,
          },
        ];
      }
    } else if (entity.type === "closure") {
      return [
        ...(!entity.used && context.pruning
          ? []
          : [
              {
                type: "function",
                name: entity.name,
                static: entity.static,
                location: `${context.specifier}:${entity.position.line}`,
                source: context.inline
                  ? context.content.substring(
                      entity.boundary.start,
                      entity.boundary.end,
                    )
                  : null,
                comment: printCommentArray(entity.comments),
                labels: entity.labels,
              },
            ]),
        ...(children.length === 0
          ? []
          : [
              {
                type: "class",
                name: entity.name,
                children,
              },
            ]),
      ];
    } /* c8 ignore start */ else {
      throw new InternalAppmapError("invalid classmap entity type");
    } /* c8 ignore stop */
  }
};

export const exportClassmap = ({ root, content }, options) =>
  digestEntity(root, { content, ...options });
