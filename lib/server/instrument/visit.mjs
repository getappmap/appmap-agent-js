import logger from '../logger.mjs';

const visitors = { __proto__: null };

export const setVisitor = (type, split, join) => {
  visitors[type] = { split, join };
};

const emptyArray = [];

export const getEmptyArray = () => emptyArray;

const emptyResult = {
  node: null,
  entities: emptyArray,
};

export const getEmptyResult = () => emptyResult;

export const getResultEntities = ({ entities }) => entities;

export const getResultNode = ({ node }) => node;

export const visit = (target, { location, namespace, file }) => {
  let node = target; // eslint no-param-reassign
  let entities = [];
  const extended = location.extend(node);
  if (extended.shouldBeInstrumented(file)) {
    if (node.type in visitors) {
      const context = {
        location: extended,
        file,
        namespace,
      };
      const { split, join } = visitors[node.type];
      const parts = split(node, context);
      const fields = [];
      for (let index = 0; index < parts.length; index += 1) {
        if (Array.isArray(parts[index])) {
          entities.push(...parts[index].flatMap(getResultEntities));
          fields[index] = parts[index].map(getResultNode);
        } else {
          entities.push(...parts[index].entities);
          fields[index] = parts[index].node;
        }
      }
      node = join(node, context, ...fields);
    } else {
      logger.error(`Cannot visit node, got: ${node.type}`);
    }
    const entity = extended.makeEntity(entities, file);
    if (entity !== null) {
      entities = [entity];
    }
  }
  return {
    node,
    entities,
  };
};
