export default (dependencies) => {
  return {
    EmptyStatement: null,
    ThrowStatement: {
      dismantle: ({ argument }) => argument,
      assemble: ({ type }, argument) => ({
        type,
        argument,
      }),
    },
    ExpressionStatement: {
      dismantle: ({ expression }) => expression,
      assemble: ({ type }, expression) => ({
        type,
        expression,
      }),
    },
    DebuggerStatement: null,
    BreakStatement: {
      dismantle: ({ label }) => label,
      assemble: ({ type }, label) => ({
        type,
        label,
      }),
    },
    ContinueStatement: {
      dismantle: ({ label }) => label,
      assemble: ({ type }, label) => ({
        type,
        label,
      }),
    },
    /////////////////
    // Declaration //
    /////////////////
    // FunctionDeclaration cf visit-functon.mjs
    // ClassDeclaration cf visit-class.mjs
    VariableDeclarator: {
      dismantle: ({ id, init }) => [id, init],
      assemble: ({ type }, [id, init]) => ({
        type,
        id,
        init,
      }),
    },
    VariableDeclaration: {
      dismantle: ({ declarations }) => declarations,
      assemble: ({ type, kind }, declarations) => ({
        type,
        kind,
        declarations,
      }),
    },
    ImportSpecifier: {
      dismantle: ({ local, imported }) => [local, imported],
      assemble: ({ type }, [local, imported]) => ({
        type,
        local,
        imported,
      }),
    },
    ImportDefaultSpecifier: {
      dismantle: ({ local }) => local,
      assemble: ({ type }, local) => ({
        type,
        local,
      }),
    },
    ImportNamespaceSpecifier: {
      dismantle: ({ local }) => local,
      assemble: ({ type }, local) => ({
        type,
        local,
      }),
    },
    ImportDeclaration: {
      dismantle: ({ specifiers, source }) => [specifiers, source],
      assemble: ({ type }, [specifiers, source]) => ({
        type,
        specifiers,
        source,
      }),
    },
    ExportSpecifier: {
      dismantle: ({ local, exported }) => [local, exported],
      assemble: ({ type }, [local, exported]) => ({
        type,
        local,
        exported,
      }),
    },
    ExportNamedDeclaration: {
      dismantle: ({ declaration, specifiers, source }) => [
        declaration,
        specifiers,
        source,
      ],
      assemble: ({ type }, [declaration, specifiers, source]) => ({
        type,
        declaration,
        specifiers,
        source,
      }),
    },
    ExportDefaultDeclaration: {
      dismantle: ({ declaration }) => declaration,
      assemble: ({ type }, declaration) => ({
        type,
        declaration,
      }),
    },
    ExportAllDeclaration: {
      dismantle: ({ source }) => source,
      assemble: ({ type }, source) => ({
        type,
        source,
      }),
    },
    //////////////
    // Compound //
    //////////////
    BlockStatement: {
      dismantle: ({ body }) => body,
      assemble: ({ type }, body) => ({
        type,
        body,
      }),
    },
    WithStatement: {
      dismantle: ({ object, body }) => [object, body],
      assemble: ({ type }, [object, body]) => ({
        type,
        object,
        body,
      }),
    },
    LabeledStatement: {
      dismantle: ({ label, body }) => [label, body],
      assemble: ({ type }, [label, body]) => ({
        type,
        label,
        body,
      }),
    },
    IfStatement: {
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
    CatchClause: {
      dismantle: ({ param, body }) => [param, body],
      assemble: ({ type }, [param, body]) => ({
        type,
        param,
        body,
      }),
    },
    TryStatement: {
      dismantle: ({ block, handler, finalizer }) => [block, handler, finalizer],
      assemble: ({ type }, [block, handler, finalizer]) => ({
        type,
        block,
        handler,
        finalizer,
      }),
    },
    WhileStatement: {
      dismantle: ({ test, body }) => [test, body],
      assemble: ({ type }, [test, body]) => ({
        type,
        test,
        body,
      }),
    },
    DoWhileStatement: {
      dismantle: ({ test, body }) => [test, body],
      assemble: ({ type }, [test, body]) => ({
        type,
        test,
        body,
      }),
    },
    ForStatement: {
      dismantle: ({ init, test, update, body }) => [init, test, update, body],
      assemble: ({ type }, [init, test, update, body]) => ({
        type,
        init,
        test,
        update,
        body,
      }),
    },
    ForInStatement: {
      dismantle: ({ left, right, body }) => [left, right, body],
      assemble: ({ type }, [left, right, body]) => ({
        type,
        left,
        right,
        body,
      }),
    },
    ForOfStatement: {
      dismantle: ({ left, right, body }) => [left, right, body],
      assemble: ({ type, await: _await }, [left, right, body]) => ({
        type,
        await: _await,
        left,
        right,
        body,
      }),
    },
    SwitchCase: {
      dismantle: ({ test, consequent }) => [test, consequent],
      assemble: ({ type }, [test, consequent]) => ({
        type,
        test,
        consequent,
      }),
    },
    SwitchStatement: {
      dismantle: ({ discriminant, cases }) => [discriminant, cases],
      assemble: ({ type }, [discriminant, cases]) => ({
        type,
        discriminant,
        cases,
      }),
    },
  };
};
