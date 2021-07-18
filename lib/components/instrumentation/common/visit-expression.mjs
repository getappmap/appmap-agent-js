export default (dependencies) => {
  const isEntityCaptured = ({
    outline: {
      caption: { origin },
    },
  }) => origin === "Property";
  const isEntityReleased = ({
    outline: {
      caption: { origin },
    },
  }) => origin !== "Property";
  return {
    /////////////
    // Literal //
    /////////////
    // ArrowFunctionExpression cf visit-function.mjs
    // FunctionExpression cf visit-function.mjs
    // ClassExpression cf visit-class.mjs
    Literal: null,
    TemplateElement: null,
    TemplateLiteral: {
      dismantle: ({ quasis, expressions }) => [quasis, expressions],
      assemble: ({ type }, [quasis, expressions]) => ({
        type,
        quasis,
        expressions,
      }),
    },
    TaggedTemplateExpression: {
      dismantle: ({ tag, quasi }) => [tag, quasi],
      assemble: ({ type }, [tag, quasi]) => ({
        type,
        tag,
        quasi,
      }),
    },
    SpreadElement: {
      dismantle: ({ argument }) => argument,
      assemble: ({ type }, argument) => ({
        type,
        argument,
      }),
    },
    ArrayExpression: {
      dismantle: ({ elements }) => elements,
      assemble: ({ type }, elements) => ({
        type,
        elements,
      }),
    },
    Property: {
      dismantle: ({ key, value }) => [key, value],
      assemble: ({ type, kind, method, computed }, [key, value]) => ({
        type,
        kind,
        method,
        computed,
        shorthand: false,
        key,
        value,
      }),
    },
    ObjectExpression: {
      extract: () => ({ name: null }),
      dismantle: ({ properties }) => properties,
      assemble: ({ type }, properties) => ({
        type,
        properties,
      }),
      sieve: (entities) => [
        entities.filter(isEntityCaptured),
        entities.filter(isEntityReleased),
      ],
    },
    /////////////////
    // Environment //
    /////////////////
    Super: null,
    ThisExpression: null,
    AssignmentExpression: {
      dismantle: ({ left, right }) => [left, right],
      assemble: ({ type, operator }, [left, right]) => ({
        type,
        operator,
        left,
        right,
      }),
    },
    UpdateExpression: {
      dismantle: ({ argument }) => argument,
      assemble: ({ type, prefix, operator }, argument) => ({
        type,
        prefix,
        operator,
        argument,
      }),
    },
    /////////////
    // Control //
    /////////////
    ImportExpression: {
      dismantle: ({ source }) => source,
      assemble: ({ type }, source) => ({
        type,
        source,
      }),
    },
    ChainExpression: {
      dismantle: ({ expression }) => expression,
      assemble: ({ type }, expression) => ({
        type,
        expression,
      }),
    },
    AwaitExpression: {
      dismantle: ({ argument }) => argument,
      assemble: ({ type }, argument) => ({
        type,
        argument,
      }),
    },
    YieldExpression: {
      dismantle: ({ argument }) => argument,
      assemble: ({ type, delegate }, argument) => ({
        type,
        delegate,
        argument,
      }),
    },
    ConditionalExpression: {
      dismantle: ({ test, consequent, alternate }) => [
        test,
        consequent,
        alternate,
      ],
      assemble: ({ type }, [test, consequent, alternate]) => ({
        type,
        test,
        consequent,
        alternate,
      }),
    },
    LogicalExpression: {
      dismantle: ({ left, right }) => [left, right],
      assemble: ({ type, operator }, [left, right]) => ({
        type,
        operator,
        left,
        right,
      }),
    },
    SequenceExpression: {
      dismantle: ({ expressions }) => expressions,
      assemble: ({ type }, expressions) => ({
        type,
        expressions,
      }),
    },
    /////////////////
    // Combination //
    /////////////////
    MemberExpression: {
      dismantle: ({ object, property }) => [object, property],
      assemble: ({ type, computed, optional }, [object, property]) => ({
        type,
        computed,
        optional,
        object,
        property,
      }),
    },
    BinaryExpression: {
      dismantle: ({ left, right }) => [left, right],
      assemble: ({ type, operator }, [left, right]) => ({
        type,
        operator,
        left,
        right,
      }),
    },
    UnaryExpression: {
      dismantle: ({ argument }) => argument,
      assemble: ({ type, prefix, operator }, argument) => ({
        type,
        prefix,
        operator,
        argument,
      }),
    },
    CallExpression: {
      dismantle: ({ callee, arguments: _arguments }) => [callee, _arguments],
      assemble: ({ type, optional }, [callee, _arguments]) => ({
        type,
        optional,
        callee,
        arguments: _arguments,
      }),
    },
    NewExpression: {
      dismantle: ({ callee, arguments: _arguments }) => [callee, _arguments],
      assemble: ({ type }, [callee, _arguments]) => ({
        type,
        callee,
        arguments: _arguments,
      }),
    },
  };
};
