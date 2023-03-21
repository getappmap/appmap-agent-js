import {
  mkdir as mkdirAsync,
  readdir as readdirAsync,
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { URL } from "node:url";
import { default as Ajv } from "ajv";
import { default as generateStandaloneModule } from "ajv/dist/standalone/index.js";
import { parse as parseYAML } from "yaml";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { url: __url } = import.meta;

const loadSchemaArrayAsync = async (directory) => {
  const schemas = [];
  for (const filename of await readdirAsync(new URL(directory))) {
    schemas.push({
      $id: filename.split(".")[0],
      ...parseYAML(await readFileAsync(new URL(filename, directory), "utf8")),
    });
  }
  return schemas;
};

const compileSchemaArray = (schemas, root) => {
  const ajv = new Ajv({
    schemas,
    verbose: true,
    code: { source: true, esm: true },
  });
  return generateStandaloneModule(ajv, root);
};

{
  const schemas = await loadSchemaArrayAsync(new URL("definitions/", __url));
  await mkdirAsync(new URL("../dist", __url), { recursive: true });
  const root = {
    validateSerial: "serial",
    validatePayload: "payload",
    validateExternalConfiguration: "configuration-external",
    validateInternalConfiguration: "configuration-internal",
    validateMessage: "message",
    validateSourceMap: "source-map",
  };
  await writeFileAsync(
    new URL("../dist/schema.mjs", __url),
    compileSchemaArray(schemas, root),
    "utf8",
  );
  await writeFileAsync(
    new URL("../dist/schema.json", __url),
    stringifyJSON(schemas, null, 2),
    "utf8",
  );
}
