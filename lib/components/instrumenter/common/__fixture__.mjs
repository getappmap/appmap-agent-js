import { strict as Assert } from 'assert';
import * as Acorn from 'acorn';
import * as Escodegen from 'escodegen';
import {Counter} from "../../../util/index.mjs";
import {visit} from "./visit.mjs";

Error.stackTraceLimit = Infinity;

const makeTest = (type) => {
  const options = { ecmaVersion: 2020, sourceType: type };
  return (code1, code2 = code1, entitie2 = []) => {
    const { node:node1, entities:entities1 } = visit(
      Acorn.parse(code1, options),
      {
        exclude: () => false,
        counter: new Counter(),
      },
      null,
    );
    Assert.equal(Escodegen.generate(node1), Escodegen.generate(Acorn.parse(code2, options)));
    Assert.deepEqual(entities1, entitie2);
  };
};

export const testModule = makeTest("module");

export const testScript = makeTest("script");

// import { RootLocation } from '../../../../../lib/server/instrument/location.mjs';
// import { File } from '../../../../../lib/server/appmap/file.mjs';
// import {
//   setVisitor,
//   visit,
//   getResultNode,
// } from '../../../../../lib/server/instrument/visit.mjs';
//
// [
//   'Identifier',
//   'FunctionExpression',
//   'AssignmentPattern',
//   'Literal',
//   'BlockStatement',
//   'Property',
//   'ExpressionStatement',
//   'AwaitExpression',
// ].forEach((type) => {
//   setVisitor(
//     type,
//     (node, location) => [],
//     (node, location, child) => node,
//   );
// });
//
// export const test = (options) => {
//   const { path, ecma, source, input, output, session, origin, keys, exclude } =
//     {
//       path: 'filname.js',
//       ecma: 2020,
//       source: 'script',
//       input: null,
//       output: null,
//       session: '$',
//       origin: 'origin',
//       exclude: new Set(),
//       keys: null,
//       ...options,
//     };
//   const file = new File(ecma, source, path, input);
//   let location = new RootLocation({
//     file,
//     origin,
//     session,
//     exclude,
//     source: false,
//     counters: {
//       object: 0,
//       class: 0,
//       arrow: 0,
//       function: 0,
//     },
//   });
//   let node1 = file.parse().fromRight();
//   let node2 = node1;
//   if (output !== null) {
//     node2 = new File(ecma, source, path, output).parse().fromRight();
//   }
//   const step = (key) => {
//     node1 = node1[key];
//     node2 = node2[key];
//   };
//   keys.forEach((key) => {
//     location = location.extend(node1);
//     if (Array.isArray(key)) {
//       key.forEach(step);
//     } else {
//       step(key);
//     }
//   });
//   const result = visit(node1, location);
//   Assert.equal(escodegen(getResultNode(result)), escodegen(node2));
// };
