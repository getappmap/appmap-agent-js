import { strict as Assert } from 'assert';
import { File } from '../../../../../lib/server/appmap/file.mjs';
import { RootLocation } from '../../../../../lib/server/instrument/location.mjs';

const path = 'test/unit/env/target/location.js';

const designator = {
  method_id: '()',
  defined_class: null,
  path,
  lineno: null,
  static: false,
};

const file = new File(
  2020,
  'module',
  path,
  `
    x;
    function f () {}
    let g = function h () {}
    export default function () {}
    class c {
      constructor () { "constructor"; }
      m1 () { "m1"; }
      static get m2 () { "m2"; }
    }
    ({
      k1: () => "k1",
      "k2": () => "k2",
      ["k3"]: () => "k3",
      ["k" + "4"]: () => "k4",
      k5 () { "k5"; },
      get k6 () { "k6"; }
    });
    var x1 = () => {};
    (x2 = () => {});
    (() => {});
  `,
);

const location0 = new RootLocation({
  file,
  source: false,
  origin: 'origin',
  session: 'session',
  counters: { arrow: 0 },
  exclude: new Set(['f']),
});
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
  Assert.equal(location1.getFile(), file);
  Assert.equal(location1.getOrigin(), 'origin');
  Assert.equal(location1.getSession(), 'session');
  const location2 = location1.extend(node1[name]);
  Assert.equal(location2.isNonScopingIdentifier(), true);
});

/////////////
// Program //
/////////////

const node1 = file.parse().fromRight();
const location1 = location0.extend(node1);
Assert.deepEqual(location1.wrapEntityArray([{ name: 'child' }]), [
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
    Assert.equal(location3.isExcluded(), false);
    Assert.deepEqual(
      location3.wrapEntityArray([{ name: 'child', bound: false }]),
      [{ name: 'child', bound: false }],
    );
    Assert.equal(location3.isNonScopingIdentifier(), false);
    Assert.equal(location3.getFile(), file);
  }
}

/////////////////////////
// FunctionDeclaration //
/////////////////////////
{
  const node2 = node1.body[1];
  const location2 = location1.extend(node2);
  Assert.equal(location2.isExcluded(), true);
  location2.common.source = true;
  Assert.deepEqual(
    location2.wrapEntityArray([{ name: 'child', bound: false }]),
    [
      {
        type: 'class',
        name: `f`,
        bound: false,
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
          { name: 'child', bound: false },
        ],
      },
    ],
  );
  location2.common.source = false;
  Assert.deepEqual(location2.wrapEntityArray([])[0].children[0].source, null);
}

//////////////////////////////
// Named FunctionExpression //
//////////////////////////////
{
  const node2 = node1.body[2];
  const location2 = location1.extend(node2);
  {
    const node3 = node2.declarations[0];
    const location3 = location2.extend(node3);
    {
      const node4 = node3.init;
      const location4 = location3.extend(node4);
      Assert.deepEqual(location4.getClosureDesignator(), {
        ...designator,
        defined_class: 'h',
        lineno: 4,
      });
    }
  }
}

/////////////////////////////////
// Default FunctionDeclaration //
/////////////////////////////////
{
  const node2 = node1.body[3];
  const location2 = location1.extend(node2);
  {
    const node3 = node2.declaration;
    const location3 = location2.extend(node3);
    Assert.deepEqual(location3.getClosureDesignator(), {
      ...designator,
      defined_class: 'default',
      lineno: 5,
    });
  }
}

//////////////////////
// ClassDeclaration //
//////////////////////
{
  const node2 = node1.body[4];
  const location2 = location1.extend(node2);
  Assert.deepEqual(
    location2.wrapEntityArray([
      { name: 'child1', bound: false },
      { name: 'child2', bound: true },
    ]),
    [
      {
        type: 'class',
        name: `c`,
        bound: false,
        children: [{ name: 'child2', bound: true }],
      },
      { name: 'child1', bound: false },
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
        Assert.deepEqual(location5.getClosureDesignator(), {
          ...designator,
          defined_class: 'constructor',
          lineno: 7,
        });
      }
    }
    // method //
    {
      const node4 = node3.body[1];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.deepEqual(location5.getClosureDesignator(), {
          ...designator,
          defined_class: 'm1',
          lineno: 8,
        });
      }
    }
    // static accessor //
    {
      const node4 = node3.body[2];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.deepEqual(location5.getClosureDesignator(), {
          ...designator,
          defined_class: 'get m2',
          lineno: 9,
          static: true,
        });
      }
    }
  }
}

//////////////////////
// ObjectExpression //
//////////////////////
{
  const node2 = node1.body[5];
  const location2 = location1.extend(node2);
  {
    let node3 = node2.expression;
    let location3 = location2.extend(node3);
    // non-computed identifier key //
    {
      const node4 = node3.properties[0];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.deepEqual(location5.getClosureDesignator(), {
          ...designator,
          defined_class: 'k1',
          lineno: 12,
        });
      }
    }
    // non-computed literal key //
    {
      const node4 = node3.properties[1];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.deepEqual(location5.getClosureDesignator(), {
          ...designator,
          defined_class: '"k2"',
          lineno: 13,
        });
      }
    }
    // computed literal key //
    {
      const node4 = node3.properties[2];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.deepEqual(location5.getClosureDesignator(), {
          ...designator,
          defined_class: '[#computed]',
          lineno: 14,
        });
      }
    }
    // computed key //
    {
      const node4 = node3.properties[3];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.deepEqual(location5.getClosureDesignator(), {
          ...designator,
          defined_class: '[#computed]',
          lineno: 15,
        });
      }
    }
    // method //
    {
      const node4 = node3.properties[4];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.deepEqual(location5.getClosureDesignator(), {
          ...designator,
          defined_class: 'k5',
          lineno: 16,
        });
      }
    }
    // accessor //
    {
      const node4 = node3.properties[5];
      const location4 = location3.extend(node4);
      {
        const node5 = node4.value;
        const location5 = location4.extend(node5);
        Assert.deepEqual(location5.getClosureDesignator(), {
          ...designator,
          defined_class: 'get k6',
          lineno: 17,
        });
      }
    }
  }
}

/////////////////////////
// VariableDeclaration //
/////////////////////////
{
  const node2 = node1.body[6];
  const location2 = location1.extend(node2);
  // identifier pattern //
  {
    const node3 = node2.declarations[0];
    const location3 = location2.extend(node3);
    {
      const node4 = node3.init;
      const location4 = location3.extend(node4);
      Assert.deepEqual(location4.getClosureDesignator(), {
        ...designator,
        defined_class: 'x1',
        lineno: 19,
      });
    }
  }
}

//////////////////////////
// AssignmentExpression //
//////////////////////////
{
  const node2 = node1.body[7];
  const location2 = location1.extend(node2);
  {
    const node3 = node2.expression;
    const location3 = location2.extend(node3);
    {
      const node4 = node3.right;
      const location4 = location3.extend(node4);
      Assert.deepEqual(location4.getClosureDesignator(), {
        ...designator,
        defined_class: 'x2',
        lineno: 20,
      });
    }
  }
}

///////////////
// Anoynmous //
///////////////

{
  const node2 = node1.body[8];
  const location2 = location1.extend(node2);
  {
    const node3 = node2.expression;
    const location3 = location2.extend(node3);
    Assert.deepEqual(location3.getClosureDesignator(), {
      ...designator,
      defined_class: 'arrow#1',
      lineno: 21,
    });
  }
}
