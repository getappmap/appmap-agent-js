
const empty = {
  node: null,
  entities: [],
};

export const getEmptyResult = () => empty;

export const getResultEntities = ({ entities }) => entities;

export const getResultNode = ({ node }) => node;

export const combineResult = (callback, node, location, ...fields) => {
  const entities = [];
  const args = [];
  for (let index = 0; index < fields.length; index += 1) {
    if (Array.isArray(fields[index])) {
      entities.push(...fields[index].flatMap(getResultEntities));
      args[index] = fields[index].map(getResultNode);
    } else {
      entities.push(...fields[index].entities);
      args[index] = fields[index].node;
    }
  }
  return {
    node: callback(node, location, ...args),
    entities,
  };
};

export const encapsulateResult = ({ node, entities }, location) => ({
  node,
  entities: [location.makeEntity(entities)],
});

export const makeTestResult = (node, entities) => {node, entities};
