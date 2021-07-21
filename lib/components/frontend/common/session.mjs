export default (dependencies) => {
  const {
    expect: { expect },
    util: { createBox, getBox, setBox },
    client: {
      initializeClient,
      terminateClient,
      sendClient,
      asyncClientTermination,
    },
  } = dependencies;
  return {
    initializeSession: (identifier, options) => {
      const client = initializeClient(options);
      sendClient(client, {
        type: "initialize",
        session: identifier,
        options,
      });
      return {
        client,
        identifier,
        terminated: createBox(false),
      };
    },
    terminateSession: ({ client, identifier, terminated }, reason) => {
      expect(
        !getBox(terminated),
        "terminateSession called on terminated session",
      );
      setBox(terminated, true);
      sendClient(client, {
        type: "terminate",
        session: identifier,
        reason,
      });
      terminateClient(client);
    },
    asyncSessionTermination: async ({ client, terminated }) => {
      await asyncClientTermination(client);
      expect(getBox(terminated), "client was terminated by the server");
    },
    //   asyncClientTermination(client).then(() => {
    //     expect(getBox(terminated), "client was terminated by the server");
    //   }),
    // asyncSessionTermination: ({ client, terminated }) =>
    //   asyncClientTermination(client).then(() => {
    //     expect(getBox(terminated), "client was terminated by the server");
    //   }),
    sendSession: ({ client, identifier, terminated }, message) => {
      expect(!getBox(terminated), "sendSession called on terminated session");
      sendClient(client, {
        type: "send",
        session: identifier,
        message,
      });
    },
  };
};
