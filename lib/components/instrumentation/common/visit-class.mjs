export default (dependencies) => {
  const isOutlineCaptured = ({
    entity: {
      caption: { origin },
    },
  }) => origin === "MethodDefinition";
  const isOutlineReleased = ({
    entity: {
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
    sieve: (outlines) => [
      outlines.filter(isOutlineCaptured),
      outlines.filter(isOutlineReleased),
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
