import { assertEqual } from "../../__fixture__.mjs";

import { escapeNodeOption, resolveShell } from "./escape.mjs";

// escapeNodeOption //

assertEqual(escapeNodeOption("token"), "token");

// resolveShell //

assertEqual(resolveShell("shell", {}), "shell");

assertEqual(resolveShell(false, {}), null);

assertEqual(resolveShell(true, { COMSPEC: "shell", SHELL: "shell" }), "shell");
