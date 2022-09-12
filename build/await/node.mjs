import { writeFile as writeFileAsync } from "fs/promises";
import {
  join as joinPath,
  relative as getRelativePath,
  dirname as getDirname,
  sep,
} from "path";
import { tmpdir as getTmpdir } from "os";
import { fileURLToPath } from "url";

const { SyntaxError, Math } = globalThis;

const __dirname = getDirname(fileURLToPath(import.meta.url));

export const supportTopAwaitAsync = async () => {
  const path = joinPath(
    getTmpdir(),
    `${Math.random().toString(36).substring(2)}.mjs`,
  );
  await writeFileAsync(path, "await 123;", "utf8");
  const relative_path = getRelativePath(__dirname, path).split(sep).join("/");
  try {
    await import(relative_path);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return false;
    } else {
      throw error;
    }
  }
  return true;
};
