import { parse, mockResult, compareResult, mapResult } from './__fixture__.mjs';
import File from '../../../../lib/file.mjs';
import Namespace from '../../../../lib/namespace.mjs';
import { RootLocation } from '../../../../lib/instrument/location.mjs';
import {
  assignVisitorObject,
  visit,
} from '../../../../lib/instrument/visit.mjs';
import '../../../../lib/instrument/visit-expression.mjs';

Error.stackTraceLimit = Infinity;

["Expression", "Pattern"].forEach((kind) => {
  assignVisitorObject(kind, {
    Identifier: (node, location) => mockResult({
      type: "Identifier",
      name: `${kind}_${node.name}`
    }, [])
  });
});

const namespace = new Namespace('PREFIX');

const test = (code1, code2) => {
  const file = new File(`filename.js`, 2020, 'script', `${code1}`);
  const location0 = new RootLocation(file, namespace);
  const node1 = file.parse();
  const location1 = location0.extend('Program', node1);
  compareResult(
    visit('Statement', node1.body[0], location1),
    mockResult(parse('Statement', code2), []),
  );
};

// const testSpecial = (code1, code2) => {
//   const file = new File(`filename.js`, 2020, 'script', `({ async * m () { (${code1}); }});`);
//   const location0 = new RootLocation(file, namespace);
//   const node1 = file.parse();
//   const location1 = location0.extend('Program', node1);
//   const node2 = node1.body[0];
//   const location2 = location1.extend('Statement', node2);
//   const node3 = node2.expression;
//   const location3 = location2.extend('Expression', node3);
//   const node4 = node3.properties[0];
//   const location4 = location3.extend('Property', node4);
//   const node5 = node4.value;
//   const location5 = location4.extend('Method', node5);
//   const node6 = node5.body;
//   const location6 = location5.extend('BlockStatement', node6);
//   const node7 = node6.body[0];
//   const location7 = location6.extend('Statement', node7);
//   compareResult(
//     visit('Expression', node7.expression, location7),
//     mockResult(parse('Program', `({ async * m () { (${code2}); }});`).body[0].expression.properties[0].value.body.body[0].expression, []),
//   );
// }

