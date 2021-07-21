export default (dependencies) => {
  return {
    AssignmentPattern: {
      dismantle: ({ left, right }) => [left, right],
      assemble: ({ type }, [left, right]) => ({
        type,
        left,
        right,
      }),
    },
    ObjectPattern: {
      dismantle: ({ properties }) => properties,
      assemble: ({ type }, properties) => ({
        type,
        properties,
      }),
    },
    ArrayPattern: {
      dismantle: ({ elements }) => elements,
      assemble: ({ type }, elements) => ({
        type,
        elements,
      }),
    },
    RestElement: {
      dismantle: ({ argument }) => argument,
      assemble: ({ type }, argument) => ({
        type,
        argument,
      }),
    },
  };
};
