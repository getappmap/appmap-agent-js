import { assertEqual, assertThrow } from "../../__fixture__.mjs";

import { escapeNodeOption, resolveShell, escapeShell } from "./escape.mjs";

// escapeNodeOption //

assertEqual(escapeNodeOption("token"), "token");

// resolveShell //

assertEqual(resolveShell("shell", {}), "shell");

assertEqual(resolveShell(false, {}), null);

assertEqual(resolveShell(true, { COMSPEC: "shell", SHELL: "shell" }), "shell");

// escapeShell //

assertThrow(
  () => escapeShell(null, "foo", "foo^|bar"),
  /^ExternalAppmapError: Could not escape token/u,
);

assertEqual(escapeShell("cmd.exe", "foo|bar"), "foo^|bar");

assertEqual(escapeShell("/bin/sh", "foo|bar"), "foo\\|bar");
