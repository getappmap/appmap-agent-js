import { assertDeepEqual } from "../../__fixture__.mjs";

import { tokenizeShell, tokenizeCmdShell } from "./tokenize.mjs";

///////////////////
// tokenizeShell //
///////////////////

assertDeepEqual(tokenizeShell("foo"), ["foo"]);

assertDeepEqual(tokenizeShell(" foo  bar "), ["foo", "bar"]);

assertDeepEqual(tokenizeShell(" foo\\ bar "), ["foo\\ bar"]);

assertDeepEqual(tokenizeShell(` "foo \\" bar" `), [`"foo \\" bar"`]);

assertDeepEqual(tokenizeShell(` '\\foo \\ bar\\' `), [`'\\foo \\ bar\\'`]);

//////////////////////
// tokenizeCmdShell //
//////////////////////

assertDeepEqual(tokenizeCmdShell("foo"), ["foo"]);

assertDeepEqual(tokenizeCmdShell(" foo  bar "), ["foo", "bar"]);

assertDeepEqual(tokenizeCmdShell(" foo^ bar "), ["foo^ bar"]);

assertDeepEqual(tokenizeCmdShell(` "^foo ^ bar^" `), [`"^foo ^ bar^"`]);
