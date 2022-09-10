/* eslint-env node */
/* eslint-disable no-console */

import { dirname } from "path";
import { fileURLToPath } from "url";
import glob from "glob";
import Mocha from "mocha";

const { parseInt, process } = globalThis;

export default (meta_url) => {
  // Instantiate a Mocha with options
  const mocha = new Mocha({
    reporter: "spec",
    timeout: parseInt(process.env.MOCHA_TIMEOUT || 2000),
  });

  const __dirname = dirname(fileURLToPath(meta_url));
  const files = glob.sync("**/*.spec.mjs", { cwd: __dirname, absolute: true });
  files.forEach((f) => mocha.addFile(f));

  mocha
    .loadFilesAsync()
    .then(() => mocha.run((failures) => (process.exitCode = failures ? 1 : 0)))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    });
};
