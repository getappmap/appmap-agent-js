import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { createRequire } from "module";
import { supportTopAwaitAsync } from "./node.mjs";
import { globAll } from "./glob.mjs";
import { wrapFile } from "./transform.mjs";
import { lintEspreeFileAsync } from "./lint.mjs";
import { formatFileAsync } from "./format.mjs";

const { process, URL } = globalThis;

export default (async () => {
  if (!(await supportTopAwaitAsync())) {
    const mapSequentialAsync = async (array1, transformAsync) => {
      const array2 = [];
      for (const element of array1) {
        array2.push(await transformAsync(element));
      }
      return array2;
    };

    await writeFileAsync(
      "build/await/load.mjs",
      `export const loadAsync = async (promise) => await (await promise).default;${"\n"}`,
      "utf8",
    );

    const transformPathAsync = async (path) => {
      process.stdout.write(`${path}...${"\n"}`);
      return await formatFileAsync(
        await lintEspreeFileAsync(
          wrapFile({
            path,
            content: await readFileAsync(path, "utf8"),
          }),
        ),
      );
    };

    const require = createRequire(new URL(import.meta.url));

    const files = await mapSequentialAsync(
      globAll(require("./glob.json")),
      transformPathAsync,
    );

    for (const { path, content } of files) {
      await writeFileAsync(path, content, "utf8");
    }
  }
})();
