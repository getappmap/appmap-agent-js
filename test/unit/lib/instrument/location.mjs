import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import File from '../../../../lib/file.mjs';
import { RootLocation } from '../../../../lib/instrument/location.mjs';

const path = 'test/unit/env/target/location.js';

FileSystem.writeFileSync(
  path,
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
    export default class {}`,
  'utf8',
);

const file = new File(path, 2015, 'module');
const node = file.parse();

const location0 = new RootLocation(file);
Assert.equal(location0.getFile(), file);
Assert.equal(location0.shouldBeInstrumented(), true);
Assert.ok(location0.makeEntity([]).type.startsWith('__APPMAP_AGENT_ERROR_'));
Assert.equal(location0.isStaticMethod([]), false);
Assert.equal(location0.isChildStaticMethod([]), false);
Assert.equal(location0.getStartLine([]), 0);
Assert.ok(location0.getName([]).startsWith('__APPMAP_AGENT_ERROR_'));
Assert.ok(location0.getChildName([]).startsWith('__APPMAP_AGENT_ERROR_'));
Assert.ok(location0.getKind([]).startsWith('__APPMAP_AGENT_ERROR_'));
Assert.ok(location0.getContainerName([]).startsWith('__APPMAP_AGENT_ERROR_'));

const node1 = node;
const location1 = location0.extend('Program', node);
Assert.equal(location1.getFile(), file);
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
  Assert.ok(
    location2.makeEntity(['child']).type.startsWith('__APPMAP_AGENT_ERROR_'),
  );
  Assert.equal(location2.getContainerName(), path);
  Assert.ok(location2.getKind().startsWith('__APPMAP_AGENT_ERROR_'));
  Assert.ok(typeof location2.getStartLine(), 'number');
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
        location: `${path}:3`,
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
              location: `${path}:5`,
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
              location: `${path}:6`,
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
          name: `constructor.m2|get`,
          childeren: [
            {
              type: 'function',
              name: '()',
              source: '() { "m2"; }',
              location: `${path}:7`,
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
      name: `§none`,
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
          name: `singleton.k1|init`,
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
          name: `singleton["k2"]|init`,
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
          name: `singleton["k3"]|init`,
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
          name: `singleton[#dynamic]|init`,
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
              location: `${path}:14`,
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
          name: `singleton.k6|get`,
          childeren: [
            {
              type: 'function',
              name: '()',
              source: '() { "k6"; }',
              location: `${path}:15`,
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

//////////////////////////
// AssignmentExpression //
//////////////////////////
{
  const node2 = node1.body[6];
  const location2 = location1.extend('Statement', node2);
  {
    const node3 = node2.declaration;
    const location3 = location2.extend('Statement', node3);
    Assert.deepEqual(location3.getName(), '@#default|class');
  }
}
