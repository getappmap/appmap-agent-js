import { strict as Assert } from 'assert';
import { generate as escodegen } from 'escodegen';

import { RootLocation } from '../../../../../lib/server/instrument/location.mjs';
import { File } from '../../../../../lib/server/appmap/file.mjs';
import {
  setVisitor,
  visit,
  getResultNode,
} from '../../../../../lib/server/instrument/visit.mjs';

[
  'Identifier',
  'FunctionExpression',
  'AssignmentPattern',
  'Literal',
  'BlockStatement',
  'Property',
  'ExpressionStatement',
  'AwaitExpression',
].forEach((type) => {
  setVisitor(
    type,
    (node, context) => [],
    (node, context, child) => node,
  );
});

export const test = (options) => {
  const { path, ecma, source, input, output, session, origin, keys } = {
    path: 'filname.js',
    ecma: 2020,
    source: 'script',
    input: null,
    output: null,
    session: '$',
    origin: 'origin',
    keys: null,
    ...options,
  };
  const file = new File(ecma, source, path, input);
  let location = new RootLocation(file);
  let node1 = file.parse().fromRight();
  let node2 = node1;
  if (output !== null) {
    node2 = new File(ecma, source, path, output).parse().fromRight();
  }
  const step = (key) => {
    node1 = node1[key];
    node2 = node2[key];
  };
  keys.forEach((key) => {
    location = location.extend(node1);
    if (Array.isArray(key)) {
      key.forEach(step);
    } else {
      step(key);
    }
  });
  const result = visit(node1, {
    location,
    options: {
      session,
      origin,
      exclude: new Set(),
    },
  });
  Assert.equal(escodegen(getResultNode(result)), escodegen(node2));
};
