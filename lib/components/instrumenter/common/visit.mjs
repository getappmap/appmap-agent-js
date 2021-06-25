import { assert, constant } from "../../../util/index.mjs";
import { setParent } from "./parent.mjs";

const visitors = new Map();

const wrappers = new Map();

export const setVisitorWrapper = (type, before, after) => {
  wrappers.set(type, { before, after });
};

export const setVisitor = (type, split, join, wrap) => {
  visitors.set(type, { split, join, wrap });
};

export const getEmptyVisitResult = constant({
  node: null,
  entities: [],
});

const getEntities = ({ entities }) => entities;

const getNode = ({ node }) => node;

const runVisitor = (node, context, entities) => {
  assert(visitors.has(node.type), "invalid node type %o", node.type);
  const { split, join } = visitors.get(node.type);
  const fields = split(node, context).map((part) => {
    if (Array.isArray(part)) {
      entities.push(...part.flatMap(getEntities));
      return part.map(getNode);
    }
    entities.push(...part.entities);
    return part.node;
  });
  return join(node, context, ...fields);
};

export const visit = (node, context, parent) => {
  setParent(node, parent);
  let entities = [];
  if (wrappers.has(node.type)) {
    const { before, after } = wrappers.get(node.type);
    const caption = before(node, context);
    if (!context.exclude(caption)) {
      node = runVisitor(node, context, entities);
      entities = after(caption, entities);
    }
  } else {
    node = runVisitor(node, context, entities);
  }
  return { entities, node };
};
