import { assertDeepEqual } from "../../__fixture__.mjs";

import { tokenizeShell, tokenize } from "./tokenize.mjs";

///////////////////
// tokenizeShell //
///////////////////

assertDeepEqual(tokenizeShell("foo"), ["foo"]);

assertDeepEqual(tokenizeShell(" foo  bar "), ["foo", "bar"]);

assertDeepEqual(tokenizeShell(" foo\\ bar "), ["foo\\ bar"]);

assertDeepEqual(tokenizeShell(` "foo \\" bar" `), [`"foo \\" bar"`]);

assertDeepEqual(tokenizeShell(` '\\foo \\ bar\\' `), [`'\\foo \\ bar\\'`]);

//////////////
// tokenize //
//////////////

assertDeepEqual(tokenize("foo bar", null), ["foo", "bar"]);

assertDeepEqual(tokenize("foo bar", "/bin/sh"), ["/bin/sh", "-c", "foo bar"]);

assertDeepEqual(tokenize("foo bar", "cmd.exe"), [
  "cmd.exe",
  "/d",
  "/s",
  "/c",
  '"foo bar"',
]);
