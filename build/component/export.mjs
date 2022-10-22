import { readFile as readFileAsync } from "fs/promises";
import { parse as parseAcorn } from "acorn";

const { Promise, URL, Error } = globalThis;

const isNotNull = (any) => any !== null;

const getExportedName = ({ exported: { name } }) => name;

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
      new URL(statement.source.value, statement.sourceFile),
    );
    /* eslint-enable no-use-before-define */
  } else {
    return [];
  }
};

const parseAcornLog = (content, options) => {
  try {
    return parseAcorn(content, options);
  } catch (error) {
    error.message += ` at ${options.directSourceFile}`;
    throw error;
  }
};

export const extractExportAsync = async (url) =>
  (
    await Promise.all(
      parseAcornLog(await readFileAsync(url, "utf8"), {
        directSourceFile: url,
        locations: true,
        sourceType: "module",
        ecmaVersion: 2022,
      }).body.map(extractStatementAsync),
    )
  ).flat();
