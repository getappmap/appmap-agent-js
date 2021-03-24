
import { visitProgram } from './visit.mjs';
import { RootLocation } from './location.mjs';

import './visit-common-other.mjs';
import './visit-common-closure.mjs';
import './visit-common-class.mjs';
import './visit-expression.mjs';
import './visit-pattern.mjs';
import './visit-statement.mjs';
import './visit-program.mjs';

export default const instrument = (file, namespace) => {
  const location = new RootLocation(file, namespace);
  if (!location.shouldBeInstrumented()) {
    return file.content;
  }
  return visitProgram(file.parse(), location);
};
