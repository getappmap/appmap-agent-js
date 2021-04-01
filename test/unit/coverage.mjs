
import { spawnSync } from './spawn.mjs';

const path1 = process.argv[2];
let path2 = `test/unit/${path1}`;

if (process.argv[2].endsWith(".js")) {
  path2 = `test/unit/${path1.substring(0, path1.length - 3)}.mjs`
}

if (path1 === "lib/client/es2015/script.js") {
  spawnSync(
    `npx nyc --hook-run-in-this-context  --reporter=html --report-dir=tmp/coverage --include ${path1} node ${path2}`,
  );
} else {
  spawnSync(
    `npx c8 --reporter=html --report-dir=tmp/coverage --include ${path1} node ${path2}`,
  );
}
spawnSync(`open tmp/coverage/index.html`);
