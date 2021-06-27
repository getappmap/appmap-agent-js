import { constant, assert } from "../../../util/index.mjs";
import { setNodeParent, setNodeIndex, setNodeCaption } from "./node.mjs";

const visitors = new Map();

export const setVisitor = (type, before, split, after, join) => {
  visitors.set(type, { wrap: { before, after }, split, join });
};

export const setSimpleVisitor = (type, split, join) => {
  visitors.set(type, { wrap: null, split, join });
};

export const getEmptyVisitResult = constant({
  node: null,
  entities: [],
});

const getEntities = ({ entities }) => entities;

const getNode = ({ node }) => node;

export const visit = (node, context, parent) => {
  setNodeParent(node, parent);
  assert(visitors.has(node.type), "invalid node type %o", node.type);
  const { wrap, split, join } = visitors.get(node.type);
  let excluded = false;
  if (wrap !== null) {
    const caption = wrap.before(node, context);
    excluded = context.exclude.has(caption.name);
    if (!excluded) {
      setNodeIndex(node, context.counter.increment());
      setNodeCaption(node, caption);
    }
  }
  let entities = [];
  if (!excluded) {
    const fields = split(node, context).map((result) => {
      if (Array.isArray(result)) {
        entities.push(...result.flatMap(getEntities));
        return result.map(getNode);
      }
      entities.push(...result.entities);
      return result.node;
    });
    if (wrap !== null) {
      entities = wrap.after(node, context, entities);
    }
    node = join(node, context, ...fields);
  }
  return { node, entities };
};
