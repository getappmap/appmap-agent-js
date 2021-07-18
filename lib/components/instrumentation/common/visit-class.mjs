export default (dependencies) => {
  const isEntityCaptured = ({
    outline: {
      caption: { origin },
    },
  }) => origin === "MethodDefinition";
  const isEntityReleased = ({
    outline: {
      caption: { origin },
    },
  }) => origin !== "MethodDefinition";
  const visitor = {
    extract: ({ head: { id } }) => ({
      name: id === null ? null : id.name,
    }),
    dismantle: ({ id, superClass, body }) => [id, superClass, body],
    assemble: ({ type }, [id, superClass, body]) => ({
      type,
      id,
      superClass,
      body,
    }),
    sieve: (entities) => [
      entities.filter(isEntityCaptured),
      entities.filter(isEntityReleased),
    ],
  };
  return {
    MethodDefinition: {
      dismantle: ({ key, value }) => [key, value],
      assemble: ({ kind, computed, static: _static }, [key, value]) => ({
        type: "MethodDefinition",
        kind,
        computed,
        static: _static,
        key,
        value,
      }),
    },
    ClassBody: {
      dismantle: ({ body }) => body,
      assemble: ({}, body) => ({
        type: "ClassBody",
        body,
      }),
    },
    ClassDeclaration: visitor,
    ClassExpression: visitor,
  };
};
