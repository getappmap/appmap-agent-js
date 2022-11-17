const {
  URL,
  Array: { isArray },
  String,
  Reflect: { ownKeys },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { hasOwnProperty, mapMaybe } = await import(
  `../../../util/index.mjs${__search}`
);

const { toStaticFunctionEntity, makeFunctionEntity, makeClassEntity } =
  await import(`./entity.mjs${__search}`);

const isKeyRelevant = (key) =>
  key !== "start" && key !== "end" && key !== "type" && key !== "loc";

const getName = ({ name }) => name;

////////////
// Result //
////////////

const makeResult = (main, side) => ({ main, side });

const takeResultMain = (result) => {
  const { main } = result;
  result.main = [];
  return main;
};

const flatResult = ({ main, side }) => [...main, ...side];

/////////////
// digest //
/////////////

/* eslint-disable no-use-before-define */

const digestNode = (node, path, name, context) => {
  if (isArray(node)) {
    return makeResult(
      [],
      node
        .map((_, index) =>
          digestChildNode(node, String(index), path, null, context),
        )
        .flatMap(flatResult),
    );
  } else if (
    typeof node === "object" &&
    node !== null &&
    hasOwnProperty(node, "type")
  ) {
    return digestEstree(node, path, name, context);
  } else {
    return makeResult([], []);
  }
};

const digestGrandChildNode = (node, key1, key2, path, name, context) =>
  digestNode(node[key1][key2], `${path}/${key1}/${key2}`, name, context);

const digestChildNode = (node, key, path, name, context) =>
  digestNode(node[key], `${path}/${key}`, name, context);

/* eslint-enable no-use-before-define */

const digestEstree = (node, path, name, context) => {
  // Naming //
  if (node.type === "AssignmentExpression") {
    const results = [
      digestChildNode(node, "left", path, null, context),
      digestChildNode(
        node,
        "right",
        path,
        node.left.type === "Identifier" ? node.left.name : null,
        context,
      ),
    ];
    return makeResult(takeResultMain(results[1]), results.flatMap(flatResult));
  } else if (node.type === "VariableDeclarator") {
    const results = [
      digestChildNode(node, "id", path, null, context),
      digestChildNode(
        node,
        "init",
        path,
        node.id.type === "Identifier" ? node.id.name : null,
        context,
      ),
    ];
    return makeResult([], results.flatMap(flatResult));
    // Forward Naming //
  } else if (node.type === "SequenceExpression") {
    const results = node.expressions.map((_, index) =>
      digestGrandChildNode(
        node,
        "expressions",
        String(index),
        path,
        index === node.expressions.length - 1 ? name : null,
        context,
      ),
    );
    return makeResult(
      takeResultMain(results[results.length - 1]),
      results.flatMap(flatResult),
    );
  } else if (node.type === "ConditionalExpression") {
    const results = [
      digestChildNode(node, "test", path, null, context),
      digestChildNode(node, "consequent", path, name, context),
      digestChildNode(node, "alternate", path, name, context),
    ];
    return makeResult(
      [...takeResultMain(results[1]), ...takeResultMain(results[2])],
      results.flatMap(flatResult),
    );
  } else if (node.type === "LogicalExpression") {
    const results = [
      digestChildNode(node, "left", path, name, context),
      digestChildNode(node, "right", path, name, context),
    ];
    return makeResult(
      [...takeResultMain(results[0]), ...takeResultMain(results[1])],
      results.flatMap(flatResult),
    );
    // Object //
  } else if (node.type === "ObjectExpression") {
    const results = node.properties.map((_, index) =>
      digestGrandChildNode(
        node,
        "properties",
        String(index),
        path,
        null,
        context,
      ),
    );
    return makeResult(
      [makeClassEntity(name, results.flatMap(takeResultMain), context)],
      results.flatMap(flatResult),
    );
  } else if (node.type === "Property") {
    const results = [
      digestChildNode(node, "key", path, null, context),
      digestChildNode(
        node,
        "value",
        path,
        !node.computed && node.key.type === "Identifier" ? node.key.name : null,
        context,
      ),
    ];
    return makeResult(takeResultMain(results[1]), results.flatMap(flatResult));
    // Class //
  } else if (
    node.type === "ClassDeclaration" ||
    node.type === "ClassExpression"
  ) {
    const results = [
      digestChildNode(node, "id", path, null, context),
      digestChildNode(node, "superClass", path, null, context),
      digestChildNode(
        node,
        "body",
        path,
        node.type === "ClassDeclaration"
          ? mapMaybe(node.id, getName) ?? "default"
          : name ?? mapMaybe(node.id, getName),
        context,
      ),
    ];
    return makeResult(takeResultMain(results[2]), results.flatMap(flatResult));
  } else if (node.type === "ClassBody") {
    const results = node.body.map((_, index) =>
      digestGrandChildNode(node, "body", String(index), path, null, context),
    );
    return makeResult(
      [makeClassEntity(name, results.flatMap(takeResultMain))],
      results.flatMap(flatResult),
    );
  } else if (node.type === "MethodDefinition") {
    const results = [
      digestChildNode(node, "key", path, null, context),
      digestChildNode(
        node,
        "value",
        path,
        !node.computed && node.key.type === "Identifier" ? node.key.name : null,
        context,
      ),
    ];
    return makeResult(
      node.static
        ? takeResultMain(results[1]).map(toStaticFunctionEntity)
        : takeResultMain(results[1]),
      results.flatMap(flatResult),
    );
    // Function //
  } else if (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionExpression" ||
    node.type === "FunctionDeclaration"
  ) {
    const results = [
      digestChildNode(node, "id", path, null, context),
      digestChildNode(node, "params", path, null, context),
      digestChildNode(node, "body", path, null, context),
    ];
    return makeResult(
      [
        makeFunctionEntity(
          node,
          path,
          node.type === "FunctionDeclaration"
            ? mapMaybe(node.id, getName) ?? "default"
            : name ?? mapMaybe(node.id, getName),
          results.flatMap(flatResult),
          context,
        ),
      ],
      [],
    );
    // Generic //
  } else {
    return makeResult(
      [],
      ownKeys(node)
        .filter(isKeyRelevant)
        .map((key) => digestChildNode(node, key, path, null, context))
        .flatMap(flatResult),
    );
  }
};

export const digestEstreeRoot = (estree, context) =>
  flatResult(digestNode(estree, "", null, context));
