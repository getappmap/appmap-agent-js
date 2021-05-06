import { generate as escodegen } from 'escodegen';
import { RootLocation } from './location.mjs';
import { visit, getResultNode, getResultEntities } from './visit.mjs';

import './visit-class.mjs';
import './visit-closure.mjs';
import './visit-expression.mjs';
import './visit-identifier.mjs';
import './visit-pattern.mjs';
import './visit-program.mjs';
import './visit-statement.mjs';

export default (options) => {
  const result = visit(options.file.parse(), {
    location: new RootLocation(),
    ...options,
  });
  return {
    content: escodegen(getResultNode(result)),
    entities: getResultEntities(result),
  };
};
