
import { generate as escodegen} from "escodegen";
import { RootLocation } from './location.mjs';
import { visit } from './visit.mjs';

import './visit-common-other.mjs';
import './visit-common-closure.mjs';
import './visit-common-class.mjs';
import './visit-expression.mjs';
import './visit-pattern.mjs';
import './visit-statement.mjs';

export default ((file, namespace) => {
  const location = new RootLocation();
  if (!location.shouldBeInstrumented(file)) {
    return file.content;
  }
  return escodegen(visit(file.parse(), {location, file, namespace}));
});
