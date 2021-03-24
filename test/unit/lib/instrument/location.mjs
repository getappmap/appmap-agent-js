import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import File from '../../../../lib/file.mjs';
import Namespace from '../../../../lib/namespace.mjs';
import { RootLocation } from '../../../../lib/instrument/location.mjs';

FileSystem.writeFileSync(
  'test/unit/env/target/location.js',
  `
    123;
    function f () {}
    class c {
      constructor () { "constructor"; }
      m1 () { "m1"; }
      static get m2 () { "m2"; }
    }
    ({
      k1: {k1},
      "k2": {k2},
      ["k3"]: {k3},
      ["k" + "4"]: {k4},
      k5 () { "k5"; },
      get k6 () { "k6"; }
    });
    var o1 = {}, {o2, o3} = {};
    o4 = {};
    `,
  'utf8',
);

const file = new File('test/unit/env/target/location.js', 2015, 'script');
// console.log(
//   file
//     .getContent()
//     .split('\n')
//     .map((line, index) => `${index}|${line}`)
//     .join('\n'),
// );
const node = file.parse();
const namespace = new Namespace('FOO');

const location0 = new RootLocation(file, namespace);
Assert.equal(location0.getFile(), file);
Assert.equal(location0.getNamespace(), namespace);
Assert.equal(location0.shouldBeInstrumented(), true);
Assert.throws(
  () => location0.makeEntity([]),
  new Error(`RootLocation cannot create entity`),
);

const node1 = node;
const location1 = location0.extend('Program', node);
Assert.equal(location1.getFile(), file);
Assert.equal(location1.getNamespace(), namespace);
Assert.equal(location1.shouldBeInstrumented(), true);
Assert.deepEqual(location1.makeEntity(['child']), {
  type: 'package',
  name: file.getPath(),
  childeren: ['child'],
});

/////////////
// Invalid //
/////////////
{
  const node2 = node1.body[0];
  const location2 = location1.extend('Statement', node2);
  Assert.deepEqual(location2.makeEntity(['child']), {
    type: '__APPMAP_AGENT_ERROR__',
    name: 'ExpressionStatement',
    childeren: ['child'],
  });
}

/////////////////////////
// FunctionDeclaration //
/////////////////////////
{
  const node2 = node1.body[1];
  const location2 = location1.extend('Statement', node2);
  Assert.deepEqual(location2.makeEntity(['child']), {
    type: 'class',
    name: `@f|function`,
    childeren: [
      {
        type: 'function',
        name: '()',
        source: 'function f () {}',
        location: 'test/unit/env/target/location.js:3',
        labels: [],
        comment: null,
        static: false,
      },
      'child',
    ],
  });
}

//////////////////////
// ClassDeclaration //
//////////////////////
{
  const node2 = node1.body[2];
  const location2 = location1.extend('Statement', node2);
  {
    const node3 = node2.body;
    const location3 = location2.extend('ClassBody', node3);
    Assert.deepEqual(location3.makeEntity(['child']), {
      type: 'class',
      name: `@c|class`,
      childeren: ['child'],
    });
    // constructor //
    {
      const node4 = node3.body[0];
      const location4 = location3.extend('MethodDefinition', node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend('Method', node5);
        Assert.deepEqual(location5.makeEntity(['child']), {
          type: 'class',
          name: `prototype.constructor|constructor`,
          childeren: [
            {
              type: 'function',
              name: '()',
              source: '() { "constructor"; }',
              location: 'test/unit/env/target/location.js:5',
              labels: [],
              comment: null,
              static: false,
            },
            'child',
          ],
        });
      }
    }
    // method //
    {
      const node4 = node3.body[1];
      const location4 = location3.extend('MethodDefinition', node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend('Method', node5);
        Assert.deepEqual(location5.makeEntity(['child']), {
          type: 'class',
          name: `prototype.m1|method`,
          childeren: [
            {
              type: 'function',
              name: '()',
              source: '() { "m1"; }',
              location: 'test/unit/env/target/location.js:6',
              labels: [],
              comment: null,
              static: false,
            },
            'child',
          ],
        });
      }
    }
    // static accessor //
    {
      const node4 = node3.body[2];
      const location4 = location3.extend('MethodDefinition', node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend('Method', node5);
        Assert.deepEqual(location5.makeEntity(['child']), {
          type: 'class',
          name: `constructor.m2|getter`,
          childeren: [
            {
              type: 'function',
              name: '()',
              source: '() { "m2"; }',
              location: 'test/unit/env/target/location.js:7',
              labels: [],
              comment: null,
              static: true,
            },
            'child',
          ],
        });
      }
    }
  }
}

//////////////////////
// ObjectExpression //
//////////////////////
{
  const node2 = node1.body[3];
  const location2 = location1.extend('Statement', node2);
  {
    const node3 = node2.expression;
    const location3 = location2.extend('Expression', node3);
    Assert.deepEqual(location3.makeEntity(['child']), {
      type: 'class',
      name: `<empty>|empty`,
      childeren: ['child'],
    });
    // non-computed identifier key //
    {
      const node4 = node3.properties[0];
      const location4 = location3.extend('Property', node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend('Expression', node5);
        Assert.deepEqual(location5.makeEntity(['child']), {
          type: 'class',
          name: `singleton.k1|value`,
          childeren: ['child'],
        });
      }
    }
    // non-computed literal key //
    {
      const node4 = node3.properties[1];
      const location4 = location3.extend('Property', node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend('Expression', node5);
        Assert.deepEqual(location5.makeEntity(['child']), {
          type: 'class',
          name: `singleton["k2"]|value`,
          childeren: ['child'],
        });
      }
    }
    // computed literal key //
    {
      const node4 = node3.properties[2];
      const location4 = location3.extend('Property', node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend('Expression', node5);
        Assert.deepEqual(location5.makeEntity(['child']), {
          type: 'class',
          name: `singleton["k3"]|value`,
          childeren: ['child'],
        });
      }
    }
    // computed key //
    {
      const node4 = node3.properties[3];
      const location4 = location3.extend('Property', node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend('Expression', node5);
        Assert.deepEqual(location5.makeEntity(['child']), {
          type: 'class',
          name: `singleton[#dynamic]|value`,
          childeren: ['child'],
        });
      }
    }
    // method //
    {
      const node4 = node3.properties[4];
      const location4 = location3.extend('Property', node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend('Expression', node5);
        Assert.deepEqual(location5.makeEntity(['child']), {
          type: 'class',
          name: `singleton.k5|method`,
          childeren: [
            {
              type: 'function',
              name: '()',
              source: '() { "k5"; }',
              location: 'test/unit/env/target/location.js:14',
              labels: [],
              comment: null,
              static: false,
            },
            'child',
          ],
        });
      }
    }
    // accessor //
    {
      const node4 = node3.properties[5];
      const location4 = location3.extend('Property', node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend('Expression', node5);
        Assert.deepEqual(location5.makeEntity(['child']), {
          type: 'class',
          name: `singleton.k6|getter`,
          childeren: [
            {
              type: 'function',
              name: '()',
              source: '() { "k6"; }',
              location: 'test/unit/env/target/location.js:15',
              labels: [],
              comment: null,
              static: false,
            },
            'child',
          ],
        });
      }
    }
  }
}

/////////////////////////
// VariableDeclaration //
/////////////////////////
{
  const node2 = node1.body[4];
  const location2 = location1.extend('Statement', node2);
  // identifier pattern //
  {
    const node3 = node2.declarations[0];
    const location3 = location2.extend('VariableDeclarator', node3);
    {
      const node4 = node3.init;
      const location4 = location3.extend('Expression', node4);
      Assert.deepEqual(location4.makeEntity(['child']), {
        type: 'class',
        name: '@o1|var',
        childeren: ['child'],
      });
    }
  }
  // non-identifier pattern //
  {
    const node3 = node2.declarations[1];
    const location3 = location2.extend('VariableDeclarator', node3);
    {
      const node4 = node3.init;
      const location4 = location3.extend('Expression', node4);
      Assert.deepEqual(location4.makeEntity(['child']), {
        type: 'class',
        name: '@#pattern|var',
        childeren: ['child'],
      });
    }
  }
}

//////////////////////////
// AssignmentExpression //
//////////////////////////
{
  const node2 = node1.body[5];
  const location2 = location1.extend('Statement', node2);
  {
    const node3 = node2.expression;
    const location3 = location2.extend('Expression', node3);
    {
      const node4 = node3.right;
      const location4 = location3.extend('Expression', node4);
      Assert.deepEqual(location4.makeEntity(['child']), {
        type: 'class',
        name: '@o4|assignment',
        childeren: ['child'],
      });
    }
  }
}
