import { setVisitor, getEmptyArray } from './visit.mjs';

export class Collision {
  constructor(message) {
    this.message = message;
  }
  getMessage() {
    return this.message;
  }
}

setVisitor('Identifier', getEmptyArray, (node, location) => {
  if (
    node.name.startsWith(location.getSession()) &&
    !location.isNonScopingIdentifier()
  ) {
    // Would be cleaner to use either because this is not a bug
    throw new Collision(
      `identifier collision detected at ${location
        .getFile()
        .getAbsolutePath()}@${node.loc.start.line}-${node.loc.start.column}: ${
        node.name
      } should not start with ${location.getSession()}`,
    );
  }
  return {
    type: 'Identifier',
    name: node.name,
  };
});
