import { assert } from '../assert.mjs';

const visitors = new Map();

export const setVisitor = (type, split, join, wrap) => {
  visitors.set(type, { split, join, wrap });
};

export const getEmptyVisitResult = constant({
  node: null,
  entities: [],
});

const getEntities = ({ entities }) => entities;

const getNode = ({ node }) => node;

export const visit = (node, context) => {
  context = {
    ... context,
    list: {head:node, tail:context.list},
    designator: makeDesignator(node, context.list, context.counter),
  };
  let entities = [];
  assert(visitors.has(node.type), 'invalid node type %o', node.type);
  if (context.name !== null && !context.exclude(context.name)) {
    const { split, join, wrap } = visitors.get(node.type);
    const fields = split(node, context).map((part) => {
      if (Array.isArray(part)) {
        entities.push(...part.flatMap(getEntities));
        return part.map(getNode);
      }
      entities.push(...part.entities);
      return part.node;
    });
    node = join(fields, context);
    entities = wrap(entities);
  }
  return {
    node,
    entities,
  };
};
