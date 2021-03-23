
const empty = {
  node: null,
  entities: []
};

export const getEmptyResult = () => empty;

export const getEntities = ({entities}) => entities;

export const getNode = ({node}) => node;

export const combine = (callback, ...fields) => {
  const entities = [];
  const args = [];
  for (let index = 0; index < fields.length; index++) {
    if (Array.isArray(field[index])) {
      entities.concat(field[index].flatMap(getEntities));
      args[index] = field[index].map(getNode);
    } else {
      entities.concat(field[index].entities);
      args[index] = field[index].node;
    }
  }
  return {
    node: callback(...args),
    entities
  };
};

export const encapsulate = ({node, entities}, location) => ({
  node,
  entities: [location.makeEntity(entities)]
});
