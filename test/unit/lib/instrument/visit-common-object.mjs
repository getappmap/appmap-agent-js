import { parse, mockResult, compareResult } from './__fixture__.mjs';
import File from '../../../../lib/file.mjs';
import Namespace from '../../../../lib/namespace.mjs';
import { RootLocation } from '../../../../lib/instrument/location.mjs';
import {
  assignVisitorObject,
  visit,
} from '../../../../lib/instrument/visit.mjs';
import '../../../../lib/instrument/visit-common-object.mjs';

Error.stackTraceLimit = Infinity;

{
  const makeVisitor = (kind) => (node, location) =>
    mockResult(
      parse('Expression', JSON.stringify(`${kind}|${node.value}`)),
      [],
    );
  assignVisitorObject('Expression', {
    Literal: makeVisitor('Expression'),
  });
  assignVisitorObject('NonComputedKey', {
    Literal: makeVisitor('NonComputedKey'),
  });
}

assignVisitorObject('Method', {
  FunctionExpression: (node, location) =>
    mockResult(parse('Expression', `function (visited) {}`), []),
});

const namespace = new Namespace('$');

{
  const file = new File('filename.js', 2020, 'script', `({["foo"]:"bar"});`);
  const location0 = new RootLocation(file, namespace);
  const node1 = file.parse();
  const location1 = location0.extend(node1);
  const node2 = node1.body[0];
  const location2 = location1.extend(node1);
  compareResult(
    visit('Expression', node2.expression, location2),
    mockResult(parse('Expression', `{["Expression|foo"]:"Expression|bar"}`), [
      {
        type: 'class',
        name: '§none',
        childeren: [],
      },
    ]),
  );
}

{
  const file = new File('filename.js', 2020, 'script', `({"foo" (bar) {}});`);
  const location0 = new RootLocation(file, namespace);
  const node1 = file.parse();
  const location1 = location0.extend(node1);
  const node2 = node1.body[0];
  const location2 = location1.extend(node1);
  compareResult(
    visit('Expression', node2.expression, location2),
    mockResult(parse('Expression', `{"NonComputedKey|foo" (visited) {} }`), [
      {
        type: 'class',
        name: '§none',
        childeren: [],
      },
    ]),
  );
}
