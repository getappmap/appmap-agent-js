import { assertEqual } from "../../__fixture__.mjs";
import { instrumentHtml } from "./html.mjs";

const {
  Infinity,
  Error,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const dead = () => {
  throw new Error("dead");
};

// prelude //
assertEqual(
  instrumentHtml(
    dead,
    [
      { type: "script", url: null, content: "/* prelude1 */" },
      { type: "module", url: "http://host/prelude2.js", content: null },
    ],
    {
      url: "protocol://host/path",
      content: [
        "<html>",
        ["<head>", "</head>"],
        ["<head>", "</head>"],
        "</html>",
      ]
        .flat(Infinity)
        .join(""),
    },
  ),
  [
    "<html>",
    [
      "<head>",
      ["<script>", "/* prelude1 */", "</script>"],
      ['<script type="module" src="http://host/prelude2.js">', "</script>"],
      "</head>",
    ],
    ["<head>", "</head>"],
    "</html>",
  ]
    .flat(Infinity)
    .join(""),
);

// attribute //
assertEqual(
  instrumentHtml(dead, [], {
    url: "protocol://host/path",
    content: [
      '<html key1=val1 key2="<val2>">',
      ["<head>", "</head>"],
      "</html>",
    ]
      .flat(Infinity)
      .join(""),
  }),
  ['<html key1="val1" key2="&ltval2&gt">', ["<head>", "</head>"], "</html>"]
    .flat(Infinity)
    .join(""),
);

// processing instruction //
assertEqual(
  instrumentHtml(dead, [], {
    url: "protocol://host/path",
    content: ["<!DOCTYPE html>", "<html>", ["<head>", "</head>"], "</html>"]
      .flat(Infinity)
      .join(""),
  }),
  ["<!DOCTYPE html>", "<html>", ["<head>", "</head>"], "</html>"]
    .flat(Infinity)
    .join(""),
);

// comment //
assertEqual(
  instrumentHtml(dead, [], {
    url: "protocol://host/path",
    content: ["<html>", "<!-- >comment< -->", ["<head>", "</head>"], "</html>"]
      .flat(Infinity)
      .join(""),
  }),
  ["<html>", "<!-- &gtcomment&lt -->", ["<head>", "</head>"], "</html>"]
    .flat(Infinity)
    .join(""),
);

// text //
assertEqual(
  instrumentHtml(dead, [], {
    url: "protocol://host/path",
    content: ["<html>", ">text<", ["<head>", "</head>"], "</html>"]
      .flat(Infinity)
      .join(""),
  }),
  ["<html>", "&gttext&lt", ["<head>", [], "</head>"], "</html>"]
    .flat(Infinity)
    .join(""),
);

// script >> external //
assertEqual(
  instrumentHtml(dead, [], {
    url: "protocol://host/path",
    content: [
      "<html>",
      [
        "<head>",
        ['<script src="path">', "/* ignored */", "</script>"],
        "</head>",
      ],
      "</html>",
    ]
      .flat(Infinity)
      .join(""),
  }),
  [
    "<html>",
    [
      "<head>",
      ['<script src="path">', "/* ignored */", "</script>"],
      "</head>",
    ],
    "</html>",
  ]
    .flat(Infinity)
    .join(""),
);

// script >> alternative type //
assertEqual(
  instrumentHtml(dead, [], {
    url: "protocol://host/path",
    content: [
      "<html>",
      [
        "<head>",
        ["<script type=importmap>", '{"imports":{}}', "</script>"],
        "</head>",
      ],
      "</html>",
    ]
      .flat(Infinity)
      .join(""),
  }),
  [
    "<html>",
    [
      "<head>",
      ['<script type="importmap">', '{"imports":{}}', "</script>"],
      "</head>",
    ],
    "</html>",
  ]
    .flat(Infinity)
    .join(""),
);

// script >> default //
assertEqual(
  instrumentHtml(
    ({ type, url, content }) =>
      `${stringifyJSON([type, url, content, "</script>"])};`,
    [],
    {
      url: "protocol://host/path",
      content: [
        "<html>",
        ["<head>", ["<script>", "/* script */", "</script>"], "</head>"],
        "</html>",
      ]
        .flat(Infinity)
        .join(""),
    },
  ),
  [
    "<html>",
    [
      "<head>",
      [
        "<script>",
        '["script","protocol://host/path#12-40","/* script */","<\\/script>"];',
        "</script>",
      ],
      "</head>",
    ],
    "</html>",
  ]
    .flat(Infinity)
    .join(""),
);

// script >> module //
assertEqual(
  instrumentHtml(({ type }) => `/* ${type} */`, [], {
    url: "protocol://host/path",
    content: [
      "<html>",
      ["<head>", ["<script type=module>", "123;", "</script>"], "</head>"],
      "</html>",
    ]
      .flat(Infinity)
      .join(""),
  }),
  [
    "<html>",
    [
      "<head>",
      ['<script type="module">', "/* module */", "</script>"],
      "</head>",
    ],
    "</html>",
  ]
    .flat(Infinity)
    .join(""),
);

// script >> before head //
assertEqual(
  instrumentHtml(dead, [], {
    url: "protocol://host/path",
    content: ["<html>", ["<script>", "123;", "</script>"], "</html>"]
      .flat(Infinity)
      .join(""),
  }),
  ["<html>", ["<script>", "123;", "</script>"], "</html>"]
    .flat(Infinity)
    .join(""),
);

// script >> unfinished //
assertEqual(
  instrumentHtml(dead, [], {
    url: "protocol://host/path",
    content: ["<html>", ["<script>", "123;"]].flat(Infinity).join(""),
  }),
  ["<html>", ["<script>", "123;", "</script>"], "</html>"]
    .flat(Infinity)
    .join(""),
);
