import { setVisitor, getEmptyArray } from './visit.mjs';

export class Collision {
  constructor(message) {
    this.message = message;
  }
  getMessage() {
    return this.message;
  }
}

setVisitor(
  'Identifier',
  getEmptyArray,
  (node, { location, options: { session } }) => {
    if (!location.isNonScopingIdentifier()) {
      if (node.name.startsWith(session)) {
        // Would be cleaner to use either because this is not a bug
        throw new Collision(
          `identifier collision detected at ${location
            .getFile()
            .getAbsolutePath()}@${location.getStartLine()}-${location.getStartColumn()}: ${
            node.name
          } should not start with ${session}`,
        );
      }
    }
    return {
      type: 'Identifier',
      name: node.name,
    };
  },
);
