import { strict as Assert } from 'assert';
import { File } from '../../../../../lib/server/appmap/file.mjs';
import { RootLocation } from '../../../../../lib/server/instrument/location.mjs';

const path = 'test/unit/env/target/location.js';

const file = new File(
  2020,
  'module',
  path,
  `
   x;
  function f () {}
  class c {
    constructor () { "constructor"; }
    m1 () { "m1"; }
    static get m2 () { "m2"; }
  }
  var o = ({
    k1: {k1},
    "k2": {k2},
    ["k3"]: {k3},
    ["k" + "4"]: {k4},
    k5 () { "k5"; },
    get k6 () { "k6"; }
  });
  var o1 = {}, {o2, o3} = {};
  o4 = {};
  export default class {}
  let g = function h () {}`,
);

const location0 = new RootLocation(file);
Assert.equal(location0.getFile(), file);

///////////////////////
// ScopingIdentifier //
///////////////////////

[
  ['BreakStatement', 'label'],
  ['ContinueStatement', 'label'],
  ['LabeledStatement', 'label'],
  ['ExportSpecifier', 'exported'],
  ['ImportSpecifier', 'imported'],
  ['MemberExpression', 'property'],
  ['Property', 'key'],
  ['MethodDefinition', 'key'],
].forEach(([type, name]) => {
  const node1 = {
    type,
    computed: false,
    [name]: {
      type: 'Identifier',
      name: 'x',
    },
  };
  const location1 = location0.extend(node1);
  const location2 = location1.extend(node1[name]);
  Assert.equal(location2.isNonScopingIdentifier(), true);
});

/////////////
// Program //
/////////////

const node1 = file.parse().fromRight();
const location1 = location0.extend(node1);
Assert.deepEqual(location1.wrapEntityArray([{ name: 'child' }], false), [
  { name: 'child' },
]);

/////////////
// Invalid //
/////////////
{
  const node2 = node1.body[0];
  const location2 = location1.extend(node2);
  {
    const node3 = node2.expression;
    const location3 = location2.extend(node3);
    Assert.deepEqual(location3.wrapEntityArray([{ name: '@child' }], false), [
      { name: '@child' },
    ]);
    Assert.equal(location3.isStaticMethod(), false);
    Assert.equal(location3.isNonScopingIdentifier(), false);
    Assert.equal(location3.getStartLine(), 2);
    Assert.equal(location3.getStartColumn(), 3);
    Assert.equal(location3.getFile(), file);
    Assert.equal(location3.hasName(), false);
    Assert.throws(() => location3.getKind());
    Assert.equal(location3.getContainerName(), '#test/unit/env/target/location.js');
  }
}

/////////////////////////
// FunctionDeclaration //
/////////////////////////
{
  const node2 = node1.body[1];
  const location2 = location1.extend(node2);
  Assert.equal(location2.getName(), '@f');
  Assert.deepEqual(
    location2.wrapEntityArray([{ name: '@child' }, { name: '#child' }], true),
    [
      {
        type: 'class',
        name: `@f`,
        children: [
          {
            type: 'function',
            name: '()',
            source: 'function f () {}',
            location: `${path}:3`,
            labels: [],
            comment: null,
            static: false,
          },
          { name: '@child' },
          { name: '#child' },
        ],
      },
    ],
  );
  Assert.deepEqual(
    location2.wrapEntityArray([], false)[0].children[0].source,
    null,
  );
}

//////////////////////
// ClassDeclaration //
//////////////////////
{
  const node2 = node1.body[2];
  const location2 = location1.extend(node2);
  Assert.equal(location2.getName(), '@c');
  Assert.deepEqual(
    location2.wrapEntityArray([{ name: '@child' }, { name: '#child' }], false),
    [
      {
        type: 'class',
        name: `@c`,
        children: [{ name: '#child' }],
      },
      { name: '@child' },
    ],
  );
  {
    const node3 = node2.body;
    const location3 = location2.extend(node3);
    // constructor //
    {
      const node4 = node3.body[0];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.equal(location5.getName(), 'constructor');
        Assert.equal(location5.getContainerName(), '@c');
      }
    }
    // method //
    {
      const node4 = node3.body[1];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.equal(location5.getName(), 'm1');
      }
    }
    // static accessor //
    {
      const node4 = node3.body[2];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.equal(location5.isStaticMethod(), true);
        Assert.equal(location5.getName(), 'static get m2');
      }
    }
  }
}

//////////////////////
// ObjectExpression //
//////////////////////
{
  const node2 = node1.body[3];
  const location2 = location1.extend(node2);
  {
    let node3 = node2.declarations[0];
    let location3 = location2.extend(node3);
    node3 = node3.init;
    location3 = location3.extend(node3);
    Assert.equal(location3.getName(), '@o');
    // non-computed identifier key //
    {
      const node4 = node3.properties[0];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.equal(location5.getName(), 'k1');
        Assert.equal(location5.getContainerName(), '@o');
      }
    }
    // non-computed literal key //
    {
      const node4 = node3.properties[1];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.equal(location5.getName(), '"k2"');
      }
    }
    // computed literal key //
    {
      const node4 = node3.properties[2];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.equal(location5.getName(), '[#computed]');
      }
    }
    // computed key //
    {
      const node4 = node3.properties[3];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.equal(location5.getName(), '[#computed]');
      }
    }
    // method //
    {
      const node4 = node3.properties[4];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.equal(location5.getName(), 'k5');
      }
    }
    // accessor //
    {
      const node4 = node3.properties[5];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.equal(location5.getName(), 'get k6');
      }
    }
  }
}

/////////////////////////
// VariableDeclaration //
/////////////////////////
{
  const node2 = node1.body[4];
  const location2 = location1.extend(node2);
  // identifier pattern //
  {
    const node3 = node2.declarations[0];
    const location3 = location2.extend(node3);
    {
      const node4 = node3.init;
      const location4 = location3.extend(node4);
      Assert.equal(location4.getName(), '@o1');
    }
  }
  // non-identifier pattern //
  {
    const node3 = node2.declarations[1];
    const location3 = location2.extend(node3);
    {
      const node4 = node3.init;
      const location4 = location3.extend(node4);
      Assert.equal(location4.getName(), '@anonymous');
    }
  }
}

//////////////////////////
// AssignmentExpression //
//////////////////////////
{
  const node2 = node1.body[5];
  const location2 = location1.extend(node2);
  {
    const node3 = node2.expression;
    const location3 = location2.extend(node3);
    {
      const node4 = node3.right;
      const location4 = location3.extend(node4);
      Assert.equal(location4.getName(), '@o4');
    }
  }
}

//////////////////////////
// AssignmentExpression //
//////////////////////////
{
  const node2 = node1.body[6];
  const location2 = location1.extend(node2);
  {
    const node3 = node2.declaration;
    const location3 = location2.extend(node3);
    Assert.deepEqual(location3.getName(), '@default');
  }
}

//////////////////////////////
// Named FunctionExpression //
//////////////////////////////
{
  const node2 = node1.body[7];
  const location2 = location1.extend(node2);
  {
    const node3 = node2.declarations[0];
    const location3 = location2.extend(node3);
    {
      const node4 = node3.init;
      const location4 = location3.extend(node4);
      Assert.deepEqual(location4.getName(), '@h');
    }
  }
}
