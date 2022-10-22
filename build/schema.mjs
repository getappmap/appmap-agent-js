import {
  readdir as readdirAsync,
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { default as Ajv } from "ajv";
import { default as generateStandaloneModule } from "ajv/dist/standalone/index.js";
import { parse as parseYAML } from "yaml";

const {
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { url: __url } = import.meta;

const schemas = [];

for (const filename of await readdirAsync(new URL("../schema", __url))) {
  schemas.push({
    $id: filename.split(".")[0],
    ...parseYAML(
      await readFileAsync(new URL(`../schema/${filename}`, __url), "utf8"),
    ),
  });
}

const ajv = new Ajv({
  schemas,
  verbose: true,
  code: { source: true, esm: true },
});

await writeFileAsync(
  new URL("../dist/schema.mjs", __url),
  generateStandaloneModule(ajv, {
    validateSerial: "serial",
    validatePayload: "payload",
    validateExternalConfiguration: "external-configuration",
    validateInternalConfiguration: "internal-configuration",
    validateMessage: "message",
    validateSourceMap: "source-map",
  }),
  "utf8",
);

await writeFileAsync(
  new URL("../dist/schema.json", __url),
  stringifyJSON(schemas, null, 2),
  "utf8",
);
