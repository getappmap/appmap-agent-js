import { strict as Assert } from 'assert';
// import { parse as acorn } from 'acorn';
import { generate as escodegen } from 'escodegen';

import { RootLocation } from '../../../../../lib/server/instrument/location.mjs';
import File from '../../../../../lib/server/file.mjs';
import Namespace from '../../../../../lib/server/namespace.mjs';
import {
  visit,
  getResultNode,
} from '../../../../../lib/server/instrument/visit.mjs';

export const test = (options) => {
  const { path, ecma, source, input, output, prefix, keys } = {
    path: 'filname.js',
    ecma: 2020,
    source: 'script',
    input: null,
    output: null,
    prefix: '$',
    keys: null,
    ...options,
  };
  let location = new RootLocation();
  const namespace = new Namespace(prefix);
  const file = new File(ecma, source, path, input);
  let node1 = file.parse();
  let node2 = node1;
  if (output !== null) {
    node2 = new File(ecma, source, path, output).parse();
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
    namespace,
    location,
    file,
  });
  // console.log("1", getResultNode(result));
  // console.log("2", escodegen(getResultNode(result)));
  // console.log("3", node2);
  // console.log("4", escodegen(node2));
  Assert.equal(escodegen(getResultNode(result)), escodegen(node2));
};
