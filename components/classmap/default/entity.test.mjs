import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { parseEstree } from "../../parse/index.mjs";
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
  url: "protocol://host/script.js",
  content: null,
  base: "protocol://host/",
  anonymous: "anonymous",
  inline: false,
  shallow: false,
};

//////////////////
// construction //
//////////////////

{
  const source = {
    url: "protocol://host/path.js",
    content: "function f () {}",
  };
  assertDeepEqual(
    wrapRootEntityArray(
      [
        makeFunctionEntity(parseEstree(source).body[0], "reference", "f", [], {
          ...default_context,
          source,
        }),
      ],
      {
        ...default_context,
        url: "protocol://host/dirname/basename.extension?search=123#hash",
      },
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
  const source = {
    url: "protocol://host/path.js",
    content: "/* @label label */ function f () {}",
  };
  assertDeepEqual(
    getEntityLabelArray(
      makeFunctionEntity(parseEstree(source).body[0], "reference", null, [], {
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
  const source = {
    url: "protocol://host/path.js",
    content: "function f () {}",
  };
  const entity = makeFunctionEntity(
    parseEstree(source).body[0],
    "reference",
    "f",
    [],
    { ...default_context, source },
  );
  assertEqual(getEntityQualifiedName(entity, entity), "f");
}

{
  const source = {
    url: "protocol://host/path.js",
    content: "function f () {}",
  };
  const entity = makeFunctionEntity(
    parseEstree(source).body[0],
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
  const source = {
    url: "protocol://host/base/script.js",
    content: "function f (x, y, z) {}",
  };
  const entity = makeClassEntity(
    "c",
    [
      makeFunctionEntity(parseEstree(source).body[0], "reference", "f", [], {
        ...default_context,
        ...source,
        shallow: true,
        base: "protocol://host/base/",
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
    assertDeepEqual(infos.get("1:0"), {
      shallow: true,
      parameters: ["x", "y", "z"],
      link: {
        defined_class: "c",
        method_id: "f",
        path: "./script.js",
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
    assertDeepEqual(infos.get("1:0"), null);
  }
}

///////////////////////////////
// hideMissingFunctionEntity //
///////////////////////////////

{
  const source = {
    url: "protocol://host/path.js",
    content: "function f () {}",
  };
  const entity = makeFunctionEntity(
    parseEstree(source).body[0],
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
    getEntitySummary(hideMissingFunctionEntity(entity, new Set(["1:0"]))),
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
  const source = {
    url: "protocol://host/path.js",
    content: "function f () {}",
  };
  const entity = makeClassEntity(
    "c",
    [
      makeFunctionEntity(parseEstree(source).body[0], "reference", "f", [], {
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
  const source = {
    url: "protocol://host/path.js",
    content: "function f () {}",
  };
  assertDeepEqual(
    toClassmapEntity(
      makeFunctionEntity(
        parseEstree(source).body[0],
        "reference",
        "f",
        [makeClassEntity("c", [], default_context)],
        {
          ...default_context,
          ...source,
          inline: true,
          url: "protocol://host/base/script.js",
          base: "protocol://host/base/",
        },
      ),
    ),
    [
      {
        type: "function",
        name: "f",
        location: "./script.js:1",
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
  const source = {
    url: "protocol://host/path.js",
    content: "function f () {}",
  };
  assertDeepEqual(
    toClassmapEntity(
      makeFunctionEntity(parseEstree(source).body[0], "reference", "f", [], {
        ...default_context,
        ...source,
        url: "protocol://host/base/script.js",
        base: "protocol://host/base/",
        inline: true,
      }),
    ),
    [
      {
        type: "function",
        name: "f",
        location: "./script.js:1",
        static: false,
        source: "function f () {}",
        comment: null,
        labels: [],
      },
    ],
  );
}
