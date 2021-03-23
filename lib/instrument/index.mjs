import { parse as acorn } from 'acorn';
import { generate as escodegen } from 'escodegen';
import { visitProgram } from './visit.mjs';
import { RootLocation } from './location.mjs';

import './visit-other.mjs';
import './visit-closure.mjs';
import './visit-class.mjs';
import './visit-expression.mjs';
import './visit-pattern.mjs';
import './visit-statement.mjs';
import './visit-program.mjs';

export default (file, namespace) =>
  escodegen(
    visitProgram(
      acorn(file.content, {
        ecmaVersion: file.getLanguageVersion(),
        sourceType: file.getSourceType(),
      }),
      new RootLocation(file, namespace),
    ),
  );
