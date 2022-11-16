const { Map, Set } = globalThis;

import { assertEqual, assertDeepEqual } from "../../../__fixture__.mjs";

import { parse } from "./parse.mjs?env=test";

import {
  wrapRootEntityArray,
  makeClassEntity,
  makeFunctionEntity,
  toStaticFunctionEntity,
  getEntityName,
  getEntityLabelArray,
  getEntityQualifiedName,
  getEntitySummary,
  excludeEntity,
  registerFunctionEntity,
  hideMissingFunctionEntity,
  removeEmptyClassEntity,
  toClassmapEntity,
} from "./entity.mjs?env=test";

const default_context = {
  relative: "script.js",
  content: "",
  anonymous: "anonymous",
  inline: false,
  shallow: false,
};

//////////////////
// construction //
//////////////////

{
  const content = "function f () {}";
  assertDeepEqual(
    wrapRootEntityArray(
      [
        makeFunctionEntity(
          parse("filename.js", content).body[0],
          "reference",
          "f",
          [],
          { ...default_context, content },
        ),
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
  const content = "/* @label label */ function f () {}";
  assertDeepEqual(
    getEntityLabelArray(
      makeFunctionEntity(
        parse("filename.js", content).body[0],
        "reference",
        null,
        [],
        { ...default_context, content },
      ),
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
  const content = "function f () {}";
  const entity = makeFunctionEntity(
    parse("filename.js", content).body[0],
    "reference",
    "f",
    [],
    { ...default_context, content },
  );
  assertEqual(getEntityQualifiedName(entity, entity), "f");
}

{
  const content = "function f () {}";
  const entity = makeFunctionEntity(
    parse("filename.js", content).body[0],
    "reference",
    "f",
    [],
    { ...default_context, content },
  );
  const parent_entity = makeClassEntity("c", [], default_context);
  assertEqual(getEntityQualifiedName(entity, parent_entity), "c.f");
  assertEqual(
    getEntityQualifiedName(toStaticFunctionEntity(entity), parent_entity),
    "c#f",
  );
}

///////////////////
// excludeEntity //
///////////////////

{
  const root_entity = makeClassEntity(
    "c",
    [makeClassEntity("d", [], default_context)],
    default_context,
  );
  assertDeepEqual(
    excludeEntity(root_entity, null, (_entity, _maybe_parent_entity) => ({
      recursive: true,
      excluded: false,
    })).map(getEntitySummary),
    [
      {
        type: "class",
        name: "c",
        children: [
          {
            type: "class",
            name: "d",
            children: [],
          },
        ],
      },
    ],
  );
  assertDeepEqual(
    excludeEntity(root_entity, null, (_entity, _maybe_parent_entity) => ({
      recursive: true,
      excluded: true,
    })).map(getEntitySummary),
    [],
  );
  assertDeepEqual(
    excludeEntity(root_entity, null, (entity, _maybe_parent_entity) => ({
      recursive: false,
      excluded: getEntityName(entity) === "c",
    })).map(getEntitySummary),
    [
      {
        type: "class",
        name: "d",
        children: [],
      },
    ],
  );
}

////////////////////////////
// registerFunctionEntity //
////////////////////////////

{
  const content = "function f (x, y, z) {}";
  const entity = makeClassEntity(
    "c",
    [
      makeFunctionEntity(
        parse("filename.js", content).body[0],
        "reference",
        "f",
        [],
        {
          ...default_context,
          shallow: true,
          relative: "relative",
          content,
        },
      ),
    ],
    default_context,
  );
  const infos = new Map();
  registerFunctionEntity(entity, null, infos);
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

///////////////////////////////
// hideMissingFunctionEntity //
///////////////////////////////

{
  const content = "function f () {}";
  const entity = makeFunctionEntity(
    parse("filename.js", content).body[0],
    "reference",
    "f",
    [],
    { ...default_context, content },
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
  const content = "function f () {}";
  const entity = makeClassEntity(
    "c",
    [
      makeFunctionEntity(
        parse("filename.js", content).body[0],
        "reference",
        "f",
        [],
        { ...default_context, content },
      ),
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
  const content = "function f () {}";
  assertDeepEqual(
    toClassmapEntity(
      makeFunctionEntity(
        parse("filename.js", content).body[0],
        "reference",
        "f",
        [makeClassEntity("c", [], default_context)],
        { ...default_context, inline: true, content },
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
  const content = "function f () {}";
  assertDeepEqual(
    toClassmapEntity(
      makeFunctionEntity(
        parse("filename.js", content).body[0],
        "reference",
        "f",
        [],
        { ...default_context, inline: true, content },
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
    ],
  );
}
