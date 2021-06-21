import { assert } from '../assert.mjs';

const visitors = { __proto__: null };

export const setVisitor = (type, split, join) => {
  visitors[type] = { split, join };
};

const empty = [];

export const getEmptyArray = () => empty;

const singleton = {
  node: null,
  entities: empty,
};

export const getEmptyResult = () => singleton;

export const getResultEntities = ({ entities }) => entities;

export const getResultNode = ({ node }) => node;

export const visit = (node, location) => {
  location = location.extend(node);
  let entities = [];
  assert(node.type in visitors, 'invalid node type %o', node.type);
  if (!location.isExcluded()) {
    const { split, join } = visitors[node.type];
    const parts = split(node, location);
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
    node = join(node, location, ...fields);
    entities = location.wrapEntityArray(entities);
  }
  return {
    node,
    entities,
  };
};
