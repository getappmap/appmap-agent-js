import {tmpdir} from "os";
import {writeFile, readFile} from "fs";

const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;

function foo () {};

function bar () {};

function qux () {};

const main = () => {
  foo();
  writeFile(path, "content", "utf8", (error) => {
    if (error) {
      throw error;
    }
    bar();
    readFile(path, "utf8", (error, content) => {
      if (error) {
        throw error;
      }
      qux();
      console.assert(content === "content");
    });
  });
};

main();
