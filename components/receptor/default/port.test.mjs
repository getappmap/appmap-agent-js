import { assertThrow, assertEqual } from "../../__fixture__.mjs";
import { toIpcPath, convertFileUrlToPath } from "../../path/index.mjs";
import { convertPort, revertPort } from "./port.mjs";

// convertPort //
assertEqual(convertPort(123), 123);
assertEqual(typeof convertPort(""), "string");
assertEqual(typeof convertPort("file:///w:/port"), "string");
assertThrow(() => convertPort(null), /^InternalAppmapError: invalid port/u);

// revertPort //
assertEqual(revertPort({ port: 123 }), 123);
assertEqual(
  revertPort(toIpcPath(convertFileUrlToPath("file:///w:/port"))),
  "file:///w:/port",
);
assertThrow(
  () => revertPort({ port: "port" }),
  /^InternalAppmapError: invalid address$/u,
);
