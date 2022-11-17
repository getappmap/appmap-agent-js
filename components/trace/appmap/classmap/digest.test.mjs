import { assertDeepEqual } from "../../../__fixture__.mjs";
import { parseEstree } from "./parse.mjs?env=test";
import { getEntitySummary } from "./entity.mjs?env=test";
import { digestEstreeRoot } from "./digest.mjs?env=test";

const digest = (content, anonymous = "dummy") =>
  digestEstreeRoot(parseEstree("protocol://host/path.mjs", content), {
    inline: false,
    shallow: false,
    content: "",
    anonymous,
  }).map(getEntitySummary);

//////////////////////
// ObjectExpression //
//////////////////////

assertDeepEqual(digest("({k1:{}, 'k2':{}, [k3]:{}})", "anonymous"), [
  {
    type: "class",
    name: "anonymous",
    children: [
      { type: "class", name: "k1", children: [] },
      { type: "class", name: "anonymous", children: [] },
      { type: "class", name: "anonymous", children: [] },
    ],
  },
]);

/////////////////////////
// FunctionDeclaration //
/////////////////////////

assertDeepEqual(digest("export default function () {}"), [
  { type: "function", name: "default", children: [] },
]);

assertDeepEqual(digest("function f () {}"), [
  { type: "function", name: "f", children: [] },
]);

//////////////////////
// ClassDeclaration //
//////////////////////

assertDeepEqual(digest("export default class {}"), [
  { type: "class", name: "default", children: [] },
]);

assertDeepEqual(digest("class c {}"), [
  { type: "class", name: "c", children: [] },
]);

//////////////////////////
// AssignemntExpression //
//////////////////////////

assertDeepEqual(digest("(o = {});"), [
  { type: "class", name: "o", children: [] },
]);

assertDeepEqual(digest("({k} = {});", "anonymous"), [
  { type: "class", name: "anonymous", children: [] },
]);

////////////////////////
// VariableDeclarator //
////////////////////////

assertDeepEqual(digest("var o = {};"), [
  { type: "class", name: "o", children: [] },
]);

assertDeepEqual(digest("var {k} = {};", "anonymous"), [
  { type: "class", name: "anonymous", children: [] },
]);

////////////////////////
// SequenceExpression //
////////////////////////

// naming //
assertDeepEqual(digest("var o = ({k1:{}}, {k2:{}}, {k3:{}});", "anonymous"), [
  {
    type: "class",
    name: "o",
    children: [{ type: "class", name: "k3", children: [] }],
  },
  {
    type: "class",
    name: "anonymous",
    children: [{ type: "class", name: "k1", children: [] }],
  },
  {
    type: "class",
    name: "anonymous",
    children: [{ type: "class", name: "k2", children: [] }],
  },
]);

// evaluation //
assertDeepEqual(digest("({k: ({k1:{}}, {k2:{}}, {k3:{}})});", "anonymous"), [
  {
    type: "class",
    name: "anonymous",
    children: [
      {
        type: "class",
        name: "k",
        children: [{ type: "class", name: "k3", children: [] }],
      },
    ],
  },
  {
    type: "class",
    name: "anonymous",
    children: [{ type: "class", name: "k1", children: [] }],
  },
  {
    type: "class",
    name: "anonymous",
    children: [{ type: "class", name: "k2", children: [] }],
  },
]);

///////////////////////////
// ConditionalExpression //
///////////////////////////

// naming //
assertDeepEqual(digest("var o = {k1:{}} ? {k2:{}} : {k3:{}};", "anonymous"), [
  {
    type: "class",
    name: "o",
    children: [{ type: "class", name: "k2", children: [] }],
  },
  {
    type: "class",
    name: "o",
    children: [{ type: "class", name: "k3", children: [] }],
  },
  {
    type: "class",
    name: "anonymous",
    children: [{ type: "class", name: "k1", children: [] }],
  },
]);

// evaluation //
assertDeepEqual(digest("({ k: {k1:{}} ? {k2:{}} : {k3:{}} });", "anonymous"), [
  {
    type: "class",
    name: "anonymous",
    children: [
      {
        type: "class",
        name: "k",
        children: [{ type: "class", name: "k2", children: [] }],
      },
      {
        type: "class",
        name: "k",
        children: [{ type: "class", name: "k3", children: [] }],
      },
    ],
  },
  {
    type: "class",
    name: "anonymous",
    children: [{ type: "class", name: "k1", children: [] }],
  },
]);

///////////////////////
// LogicalExpression //
///////////////////////

// naming //
assertDeepEqual(digest("var o = {k1:{}} ?? {k2:{}};", "anonymous"), [
  {
    type: "class",
    name: "o",
    children: [{ type: "class", name: "k1", children: [] }],
  },
  {
    type: "class",
    name: "o",
    children: [{ type: "class", name: "k2", children: [] }],
  },
]);

// evaluation //
assertDeepEqual(digest("({ k: {k1:{}} ?? {k2:{}} });", "anonymous"), [
  {
    type: "class",
    name: "anonymous",
    children: [
      {
        type: "class",
        name: "k",
        children: [{ type: "class", name: "k1", children: [] }],
      },
      {
        type: "class",
        name: "k",
        children: [{ type: "class", name: "k2", children: [] }],
      },
    ],
  },
]);

////////////////////////
// FunctionExpression //
////////////////////////

assertDeepEqual(digest("(function f () { var o = {}; })"), [
  {
    type: "function",
    name: "f",
    children: [{ type: "class", name: "o", children: [] }],
  },
]);

/////////////////////
// ClassExpression //
/////////////////////

assertDeepEqual(
  digest(
    `
      (class c extends {proto:{}} {
        constructor () {}
        method () {}
        static "method" () {}
        static ["method"] () {}
      })
    `,
    "anonymous",
  ),
  [
    {
      type: "class",
      name: "c",
      children: [
        { type: "function", name: "constructor", children: [] },
        { type: "function", name: "method", children: [] },
        { type: "function", name: "anonymous", children: [] },
        { type: "function", name: "anonymous", children: [] },
      ],
    },
    {
      type: "class",
      name: "anonymous",
      children: [{ type: "class", name: "proto", children: [] }],
    },
  ],
);
