import { parse, mockResult, compareResult } from './__fixture__.mjs';
import File from '../../../../lib/file.mjs';
import Namespace from '../../../../lib/namespace.mjs';
import { RootLocation } from '../../../../lib/instrument/location.mjs';
import {
  assignVisitorObject,
  visit,
} from '../../../../lib/instrument/visit.mjs';
import '../../../../lib/instrument/visit-program.mjs';

Error.stackTraceLimit = Infinity;

assignVisitorObject('Statement', {
  ExpressionStatement: (node, location) =>
    mockResult(parse('Statement', `Statement;`), []),
});

const namespace = new Namespace('$');

{
  const file = new File(
    `filename.js`,
    2020,
    'script',
    `
      123;
      456;`,
  );
  const location0 = new RootLocation(file, namespace);
  compareResult(
    visit('Program', file.parse(), location0),
    mockResult(parse("Program", `Statement; Statement;`), []),
  );
}
