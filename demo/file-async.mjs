
import {tmpdir} from "os";
import {writeFile, readFile} from "fs/promises";

const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;

function foo () {};

function bar () {};

function qux () {};

const mainAsync = async () => {
  foo();
  await writeFile(path, "content", "utf8");
  bar();
  const content = await readFile(path, "utf8");
  qux();
  console.assert(content === "content");
};

mainAsync();
