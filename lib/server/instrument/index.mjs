import { generate as escodegen } from 'escodegen';
import { Left } from '../either.mjs';
import { RootLocation } from './location.mjs';
import { visit, getResultNode, getResultEntities } from './visit.mjs';

import './visit-class.mjs';
import './visit-closure.mjs';
import './visit-expression.mjs';
import { Collision } from './visit-identifier.mjs';
import './visit-pattern.mjs';
import './visit-program.mjs';
import './visit-statement.mjs';

export const instrument = (file, options) => {
  try {
    return file.parse().mapRight((node) => {
      const result = visit(node, {
        location: new RootLocation(file),
        options,
      });
      return {
        content: escodegen(getResultNode(result)),
        entities: getResultEntities(result),
      };
    });
    // c8 vs node12
    /* c8 ignore start */
  } catch (error) {
    /* c8 ignore stop */
    if (error instanceof Collision) {
      return new Left(error.getMessage());
    }
    /* c8 ignore start */ throw error;
  } /* c8 ignore stop */
};
