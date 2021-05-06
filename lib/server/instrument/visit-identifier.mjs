import { setVisitor, getEmptyArray } from './visit.mjs';

export class Collision {
  constructor (message) {
    this.message = message;
  }
  getMessage () {
    return this.message;
  }
};

setVisitor('Identifier', getEmptyArray, (node, {location, options:{prefix}}) => {
  if (!location.isNonScopingIdentifier()) {
    if (node.name.startsWith(prefix)) {
      // Would be cleaner to use either because this is not a bug
      throw new Collision(
        `identifier collision detected at ${
          location.getFile().getPath()
        }@${
          location.getStartLine()
        }-${
          location.getStartColumn()
        }: ${
          node.name
        } should not start with ${
          prefix
        }`
      );
    }
  }
  return {
    type: 'Identifier',
    name: node.name,
  };
});
