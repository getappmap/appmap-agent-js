import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";

import { createSource, parseSource } from "../../source/index.mjs";

import {
  wrapRootEntityArray,
  makeClassEntity,
  makeFunctionEntity,
  toStaticFunctionEntity,
  getEntityName,
  getEntityLabelArray,
  getEntityQualifiedName,
  getEntitySummary,
  registerEntityTree,
  hideMissingFunctionEntity,
  removeEmptyClassEntity,
  toClassmapEntity,
} from "./entity.mjs";

const { Map, Set } = globalThis;

const default_context = {
  relative: "script.js",
  source: null,
  anonymous: "anonymous",
  inline: false,
  shallow: false,
};

//////////////////
// construction //
//////////////////

{
  const source = createSource("protocol://host/path.js", "function f () {}");
  assertDeepEqual(
    wrapRootEntityArray(
      [
        makeFunctionEntity(parseSource(source).body[0], "reference", "f", [], {
          ...default_context,
          source,
        }),
      ],
      { ...default_context, relative: "dirname/basename.extension" },
    ).map(getEntitySummary),
    [
      {
        type: "class",
        name: "basename",
        children: [
          {
            type: "function",
            name: "f",
            children: [],
          },
        ],
      },
    ],
  );
}

assertDeepEqual(
  wrapRootEntityArray(
    [makeClassEntity("c", [], default_context)],
    default_context,
  ).map(getEntitySummary),
  [{ type: "class", name: "c", children: [] }],
);

///////////////////
// getEntityName //
///////////////////

assertEqual(
  getEntityName(
    makeClassEntity("name", [], { ...default_context, anonymous: "anonymous" }),
  ),
  "name",
);

assertEqual(
  getEntityName(
    makeClassEntity(null, [], { ...default_context, anonymous: "anonymous" }),
  ),
  "anonymous",
);

/////////////////////////
// getEntityLabelArray //
/////////////////////////

{
  const source = createSource(
    "protocol://host/path.js",
    "/* @label label */ function f () {}",
  );
  assertDeepEqual(
    getEntityLabelArray(
      makeFunctionEntity(parseSource(source).body[0], "reference", null, [], {
        ...default_context,
        source,
      }),
    ),
    ["label"],
  );
}

assertDeepEqual(
  getEntityLabelArray(makeClassEntity("c", [], default_context)),
  [],
);

//////////////////////////////////////////////////////
// getEntityQualifiedName && toStaticFunctionEntity //
//////////////////////////////////////////////////////

assertEqual(
  getEntityQualifiedName(makeClassEntity("c", [], default_context), null),
  "c",
);

{
  const source = createSource("protocol://host/path.js", "function f () {}");
  const entity = makeFunctionEntity(
    parseSource(source).body[0],
    "reference",
    "f",
    [],
    { ...default_context, source },
  );
  assertEqual(getEntityQualifiedName(entity, entity), "f");
}

{
  const source = createSource("protocol://host/path.js", "function f () {}");
  const entity = makeFunctionEntity(
    parseSource(source).body[0],
    "reference",
    "f",
    [],
    { ...default_context, source },
  );
  const parent_entity = makeClassEntity("c", [], default_context);
  assertEqual(getEntityQualifiedName(entity, parent_entity), "c.f");
  assertEqual(
    getEntityQualifiedName(toStaticFunctionEntity(entity), parent_entity),
    "c#f",
  );
}

////////////////////////////
// registerFunctionEntity //
////////////////////////////

{
  const source = createSource(
    "protocol://host/path.js",
    "function f (x, y, z) {}",
  );
  const entity = makeClassEntity(
    "c",
    [
      makeFunctionEntity(parseSource(source).body[0], "reference", "f", [], {
        ...default_context,
        shallow: true,
        relative: "relative",
        source,
      }),
    ],
    default_context,
  );
  {
    const infos = new Map();
    registerEntityTree(
      entity,
      null,
      null,
      infos,
      (_entity, _maybe_parent_entity) => ({
        recursive: false,
        excluded: false,
      }),
    );
    assertDeepEqual(infos.get("reference"), {
      shallow: true,
      parameters: ["x", "y", "z"],
      link: {
        defined_class: "c",
        method_id: "f",
        path: "relative",
        lineno: 1,
        static: false,
      },
    });
  }
  {
    const infos = new Map();
    registerEntityTree(
      entity,
      null,
      null,
      infos,
      (entity, _maybe_parent_entity) => {
        assertEqual(entity.name, "c");
        return {
          recursive: true,
          excluded: true,
        };
      },
    );
    assertDeepEqual(infos.get("reference"), null);
  }
}

///////////////////////////////
// hideMissingFunctionEntity //
///////////////////////////////

{
  const source = createSource("protocol://host/path.js", "function f () {}");
  const entity = makeFunctionEntity(
    parseSource(source).body[0],
    "reference",
    "f",
    [],
    { ...default_context, source },
  );
  assertDeepEqual(
    getEntitySummary(hideMissingFunctionEntity(entity, new Set())),
    {
      type: "class",
      name: "f",
      children: [],
    },
  );
  assertDeepEqual(
    getEntitySummary(hideMissingFunctionEntity(entity, new Set(["reference"]))),
    {
      type: "function",
      name: "f",
      children: [],
    },
  );
}

////////////////////////////
// removeEmptyClassEntity //
////////////////////////////

{
  const source = createSource("protocol://host/path.js", "function f () {}");
  const entity = makeClassEntity(
    "c",
    [
      makeFunctionEntity(parseSource(source).body[0], "reference", "f", [], {
        ...default_context,
        source,
      }),
    ],
    default_context,
  );
  assertDeepEqual(removeEmptyClassEntity(entity).map(getEntitySummary), [
    {
      type: "class",
      name: "c",
      children: [
        {
          type: "function",
          name: "f",
          children: [],
        },
      ],
    },
  ]);
}

assertDeepEqual(
  removeEmptyClassEntity(
    makeClassEntity(
      "c",
      [makeClassEntity("d", [], default_context)],
      default_context,
    ),
  ),
  [],
);

//////////////////////
// toClassmapEntity //
//////////////////////

{
  const source = createSource("protocol://host/path.js", "function f () {}");
  assertDeepEqual(
    toClassmapEntity(
      makeFunctionEntity(
        parseSource(source).body[0],
        "reference",
        "f",
        [makeClassEntity("c", [], default_context)],
        { ...default_context, inline: true, source },
      ),
    ),
    [
      {
        type: "function",
        name: "f",
        location: "script.js:1",
        static: false,
        source: "function f () {}",
        comment: null,
        labels: [],
      },
      {
        type: "class",
        name: "f",
        children: [{ type: "class", name: "c", children: [] }],
      },
    ],
  );
}

{
  const source = createSource("protocol://host/path.js", "function f () {}");
  assertDeepEqual(
    toClassmapEntity(
      makeFunctionEntity(parseSource(source).body[0], "reference", "f", [], {
        ...default_context,
        inline: true,
        source,
      }),
    ),
    [
      {
        type: "function",
        name: "f",
        location: "script.js:1",
        static: false,
        source: "function f () {}",
        comment: null,
        labels: [],
      },
    ],
  );
}
