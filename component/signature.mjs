import { readFile as readFileAsync } from "fs/promises";
import BabelParser from "@babel/parser";
import {
  readInstanceArrayAsync,
  readComponentArrayAsync,
  getInstanceMainUrl,
} from "./layout.mjs";

const {
  JSON: { stringify: stringifyJSON },
  Math: { max },
  Promise,
  URL,
  Error,
} = globalThis;

const { parse: parseBabel } = BabelParser;

const isNotNull = (any) => any !== null;

const getExportedName = ({ exported: { name } }) => name;

export const isArrayShallowEqual = (array1, array2) => {
  const { length: length1 } = array1;
  const { length: length2 } = array2;
  if (length1 !== length2) {
    return false;
  } else {
    for (let index = 0; index < length1; index += 1) {
      if (array1[index] !== array2[index]) {
        return false;
      }
    }
    return true;
  }
};

const extractPattern = (pattern) => {
  if (pattern.type === "Identifier") {
    return [pattern.name];
  } else if (pattern.type === "RestElement") {
    return extractPattern(pattern.argument);
  } else if (pattern.type === "AssignmentPattern") {
    return extractPattern(pattern.left);
  } else if (pattern.type === "ObjectPattern") {
    return pattern.properties.flatMap(extractPattern);
  } else if (pattern.type === "Property") {
    return extractPattern(pattern.value);
  } else if (pattern.type === "ArrayPattern") {
    return pattern.elements.filter(isNotNull).flatMap(extractPattern);
  } else {
    throw new Error(`Invalid pattern type: ${pattern.type}`);
  }
};

const extractDeclaration = ({ id }) => extractPattern(id);

const extractStatementAsync = (statement) => {
  if (statement.type === "ExportNamedDeclaration") {
    if (statement.declaration !== null) {
      if (statement.declaration.type === "VariableDeclaration") {
        return statement.declaration.declarations.flatMap(extractDeclaration);
      } else {
        return [statement.declaration.id.name];
      }
    } else {
      return statement.specifiers.map(getExportedName);
    }
  } else if (statement.type === "ExportDefaultDeclaration") {
    return ["default"];
  } else if (statement.type === "ExportAllDeclaration") {
    /* eslint-disable no-use-before-define */
    return extractExportAsync(
      new URL(statement.source.value, statement.loc.filename),
    );
    /* eslint-enable no-use-before-define */
  } else {
    return [];
  }
};

const parseBabelLog = (content, url) => {
  try {
    return parseBabel(content, {
      sourceType: "module",
      sourceFilename: url,
      plugins: ["estree"],
    }).program;
  } catch (error) {
    error.message += ` at ${url}`;
    throw error;
  }
};

const extractExportAsync = async (url) =>
  (
    await Promise.all(
      parseBabelLog(await readFileAsync(url, "utf8"), url).body.map(
        extractStatementAsync,
      ),
    )
  ).flat();

const loadSignatureAsync = async (home, component, instance) => {
  const exports = await extractExportAsync(
    getInstanceMainUrl(home, component, instance),
  );
  exports.sort();
  return exports;
};

export const checkComponentSignatureAsync = async (home, component) => {
  let first = null;
  for (const instance of await readInstanceArrayAsync(home, component)) {
    if (first === null) {
      first = {
        instance,
        signature: await loadSignatureAsync(home, component, instance),
      };
    } else {
      const signature = await loadSignatureAsync(home, component, instance);
      if (!isArrayShallowEqual(first.signature, signature)) {
        const padding = max(first.instance.length, instance.length);
        throw new Error(
          [
            `Signature mismatch on component ${component} between:`,
            ` - ${first.instance.padEnd(padding)} >> ${stringifyJSON(
              first.signature,
            )}`,
            ` - ${instance.padEnd(padding)} >> ${stringifyJSON(signature)}`,
          ].join("\n"),
        );
      }
    }
  }
};

export const checkSignatureAsync = async (home) => {
  await Promise.all(
    (
      await readComponentArrayAsync(home)
    ).map((component) => checkComponentSignatureAsync(home, component)),
  );
};
