import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import File from '../../../../lib/file.mjs';
import * as Dummy from '../../../../lib/instrumenter/dummy.mjs';
import * as Context from '../../../../lib/instrumenter/context.mjs';
import Location from '../../../../lib/instrumenter/location.mjs';

FileSystem.writeFileSync(
  'test/unit/env/target/location.js',
  `
    o = {};
    f = () => {};
    123;`,
  'utf8',
);

const file = new File('test/unit/env/target/location.js', 2015, 'script');
const node = file.parse();

const location1 = new Location(file, "namespace", node, Context.getVoidContext(), []);
Assert.equal(location1.getFile(), file);
Assert.equal(location1.getNamespace(), "namespace");
Assert.equal(location1.shouldBeInstrumented(), true);
Assert.deepEqual(
  location1.makeEntity([{ type: 'class', name: 'foo', childeren: [] }]),
  {
    type: 'package',
    name: file.getPath(),
    childeren: [{ type: 'class', name: 'foo', childeren: [] }],
  },
);

const location2 = location1.makeDeeperLocation(
  node.body[0].expression.right,
  new Context.VariableContext(node.body[0].expression.left, 'assignment'),
);
Assert.deepEqual(location2.makeEntity([]), {
  type: 'class',
  name: '@o|assignment',
  childeren: [],
});

const location3 = location1.makeDeeperLocation(
  node.body[1].expression.right,
  new Context.VariableContext(node.body[1].expression.left, 'assignment'),
);
Assert.deepEqual(location3.makeEntity([]), {
  type: 'class',
  name: '@f|assignment',
  childeren: [
    {
      type: 'function',
      name: '()',
      source: '() => {}',
      location: `${file.getPath()}:3`,
      labels: [],
      comment: null,
      static: false,
    },
  ],
});

const location4 = location1.makeDeeperLocation(
  node.body[2].expression,
  Context.getVoidContext(),
);
Assert.deepEqual(location4.makeEntity([]), Dummy.getClassEntity());

