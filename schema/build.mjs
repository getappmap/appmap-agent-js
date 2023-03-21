import {
  mkdir as mkdirAsync,
  readdir as readdirAsync,
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { stdout } from "node:process";
import { URL } from "node:url";
import { default as Ajv } from "ajv";
import { default as generateStandaloneModule } from "ajv/dist/standalone/index.js";
import { parse as parseYAML } from "yaml";

const {
  Set,
  Reflect: { ownKeys },
  Array: { isArray },
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

const findDeadSchemaArray = (schemas, ids) => {
  const used = new Set();
  const useId = (id) => {
    if (!used.has(id)) {
      used.add(id);
      for (const schema of schemas) {
        if (schema.$id === id) {
          /* eslint-disable no-use-before-define */
          use(schema);
          /* eslint-enable no-use-before-define */
        }
      }
    }
  };
  const use = (json) => {
    if (isArray(json)) {
      json.forEach(use);
    } else if (typeof json === "object" && json !== null) {
      for (const key of ownKeys(json)) {
        if (key === "$ref") {
          useId(json[key]);
        } else {
          use(json[key]);
        }
      }
    }
  };
  for (const id of ids) {
    useId(id);
  }
  return schemas.map((schema) => schema.$id).filter((id) => !used.has(id));
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
  const deads = findDeadSchemaArray(schemas, [
    "config",
    ...ownKeys(root).map((key) => root[key]),
  ]);
  if (deads.length > 0) {
    stdout.write(`unused schemas: ${deads.join(", ")}\n`);
  }
}
