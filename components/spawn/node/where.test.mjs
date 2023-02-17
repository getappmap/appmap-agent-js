import { platform } from "node:process";
import { assertEqual, assertMatch, assertReject } from "../../__fixture__.mjs";
import { pickWin32Exec, whereAsync } from "./where.mjs";

const { Set } = globalThis;

assertEqual(pickWin32Exec(["foo", "foo.cmd"]), "foo.cmd");

assertEqual(pickWin32Exec(["foo", "foo.exe"]), "foo.exe");

assertEqual(pickWin32Exec(["foo.cmd", "foo.exe"]), "foo.exe");

if (platform === "win32") {
  assertMatch(await whereAsync("node", new Set()), /node/u);
} else {
  await assertReject(
    whereAsync("node", new Set()),
    /^Error: spawn where.exe ENOENT$/u,
  );
}
