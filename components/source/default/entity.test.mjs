import { assertMatchJSON } from "../../__fixture__.mjs";
import { parseEstree } from "../../parse/index.mjs";
import { toEntity } from "./entity.mjs";

const testFile = (code, file, pattern) => {
  assertMatchJSON(
    toEntity(
      parseEstree({
        url: `protocol://host/directory/${file}`,
        content: code,
      }),
      file.split(".")[0],
    ),
    pattern,
  );
};

const test = (code, pattern) => {
  testFile(code, "script.js", pattern);
};

//////////
// File //
//////////

testFile("123;", "script.js", {
  type: "file",
  name: "script",
  children: [],
});

//////////////////////////
// AssignmentExpression //
//////////////////////////

test("(o = {});", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
    },
  ],
});

test("({o} = {});", {
  type: "file",
  children: [
    {
      type: "class",
      name: "[anonymous]",
    },
  ],
});

/////////////////////////
// VariableDeclaration //
/////////////////////////

test("var o;", {});

test("var o = {};", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
    },
  ],
});

test("var {o} = {};", {
  type: "file",
  children: [
    {
      type: "class",
      name: "[anonymous]",
    },
  ],
});

/////////////////////////
// FunctionDeclaration //
/////////////////////////

test("function f () {}", {
  type: "file",
  children: [
    {
      type: "closure",
      name: "f",
    },
  ],
});

test("export default function () {};", {
  type: "file",
  children: [
    {
      type: "closure",
      name: "default",
    },
  ],
});

////////////////////////
// FunctionExpression //
////////////////////////

test("(f = function g () {});", {
  type: "file",
  children: [
    {
      type: "closure",
      name: "f",
    },
  ],
});

test("(function f () {});", {
  type: "file",
  children: [
    {
      type: "closure",
      name: "f",
    },
  ],
});

test("(function () {});", {
  type: "file",
  children: [
    {
      type: "closure",
      name: "[anonymous]",
    },
  ],
});

//////////////////////
// ClassDeclaration //
//////////////////////

test("class c {}", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
    },
  ],
});

test("export default class {};", {
  type: "file",
  children: [
    {
      type: "class",
      name: "default",
    },
  ],
});

/////////////////////
// ClassExpression //
/////////////////////

test("(c = class d {});", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
    },
  ],
});

test("(class c {});", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
    },
  ],
});

test("(class {});", {
  type: "file",
  children: [
    {
      type: "class",
      name: "[anonymous]",
    },
  ],
});

/////////////////////
// Arrow && Object //
/////////////////////

test("(f = () => {});", {
  type: "file",
  children: [
    {
      type: "closure",
      name: "f",
    },
  ],
});

test("(o = {});", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
    },
  ],
});

////////////
// Object //
////////////

test("(o = { m () {} });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
      children: [
        {
          type: "closure",
          name: "m",
          static: false,
        },
      ],
    },
  ],
});

test("(o = { ... {} });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
      children: [],
    },
  ],
});

test("(o = { [123] () {} });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
      children: [
        {
          type: "closure",
          name: "[dynamic]",
          static: false,
        },
      ],
    },
  ],
});

///////////
// Class //
///////////

test("(class c extends {} {});", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
    },
    {
      type: "class",
      name: "[anonymous]",
    },
  ],
});

test("(class c { constructor () {} });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
      children: [
        {
          type: "closure",
          name: "constructor",
          static: false,
        },
      ],
    },
  ],
});

test("(class c { m () {} });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
      children: [
        {
          type: "closure",
          name: "m",
          static: false,
        },
      ],
    },
  ],
});

test("(class c { static m () {} });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
      children: [
        {
          type: "closure",
          name: "m",
          static: true,
        },
      ],
    },
  ],
});

test("(class c { [123] () {} });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
      children: [
        {
          type: "closure",
          name: "[dynamic]",
          static: false,
        },
      ],
    },
  ],
});

test("(class c { m = function f () {} });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
      children: [
        {
          type: "closure",
          name: "m",
          static: false,
        },
      ],
    },
  ],
});

test("(class c { [123] = function f () {} });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
      children: [
        {
          type: "closure",
          name: "[dynamic]",
          static: false,
        },
      ],
    },
  ],
});

test("(class c { k });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
      children: [],
    },
  ],
});

testFile("abstract class c { abstract m (): string };", "script.ts", {
  type: "file",
  children: [
    {
      type: "class",
      name: "c",
      children: [
        {
          type: "closure",
          name: "m",
          children: [],
        },
      ],
    },
  ],
});

////////////////////////////////////////////
// Propagation >> Environment >> Sequence //
////////////////////////////////////////////

test("(o = ({}, 456));", {
  type: "file",
  children: [
    {
      type: "class",
      name: "[anonymous]",
    },
  ],
});

test("(o = (123, {}));", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
    },
  ],
});

///////////////////////////////////////////////
// Propagation >> Environment >> Conditional //
///////////////////////////////////////////////

test("(o = {} ? 456 : 789);", {
  type: "file",
  children: [
    {
      type: "class",
      name: "[anonymous]",
    },
  ],
});

test("(o = 123 ? {} : 789);", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
    },
  ],
});

test("(o = 123 ? 456 : {});", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
    },
  ],
});

///////////////////////////////////////////
// Propagation >> Environment >> Logical //
///////////////////////////////////////////

test("(o = {} && 456);", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
    },
  ],
});

test("(o = 123 && {});", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
    },
  ],
});

///////////////////////////////////////
// Propagation >> Object >> Sequence //
///////////////////////////////////////

test("(o = { k: ({}, 456) });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
    },
    {
      type: "class",
      name: "[anonymous]",
    },
  ],
});

test("(o = { k: (123, {}) });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
      children: [
        {
          type: "class",
          name: "k",
        },
      ],
    },
  ],
});

//////////////////////////////////////////
// Propagation >> Object >> Conditional //
//////////////////////////////////////////

test("(o = { k: {} ? 456 : 789 })", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
    },
    {
      type: "class",
      name: "[anonymous]",
    },
  ],
});

test("(o = { k: 123 ? {} : 789 })", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
      children: [
        {
          type: "class",
          name: "k",
        },
      ],
    },
  ],
});

test("(o = { k: 123 ? 456 : {} })", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
      children: [
        {
          type: "class",
          name: "k",
        },
      ],
    },
  ],
});

//////////////////////////////////////
// Propagation >> Object >> Logical //
//////////////////////////////////////

test("(o = { k: {} && 456 });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
      children: [
        {
          type: "class",
          name: "k",
        },
      ],
    },
  ],
});

test("(o = { k: 123 && {} });", {
  type: "file",
  children: [
    {
      type: "class",
      name: "o",
      children: [
        {
          type: "class",
          name: "k",
        },
      ],
    },
  ],
});
