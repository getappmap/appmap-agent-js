
const getClient = ({client}) => client;

export default (dependencies) => {
  const {util: {expect, getUniqueIdentifier}, client:{openClient, closeClient, sendClient, awaitClient}} = dependencies;
  return {
    awaitSession: ({client, closed}) => awaitClient(client).then(() => {
      expect(getBox(closed), "client was closed by the server");
    }),
    openSession: (options) => {
      const session = {
        client: openClient(options),
        identifier: getUniqueIdentifier(),
        closed: createBox(false),
      };
      const {client, identifier} = session;
      sendClient(client, {
        type: "open",
        session: identifier,
        options,
      });
      return session;
    },
    closeSession: ({client, identifier, closed}, reason) => {
      expect(!getBox(closed), "closeSession called on closed session");
      setBox(closed, true);
      sendClient(
        client,
        {
          type: "close",
          session: identifier,
          reasons,
        },
      );
    },
    sendSession({client, identifier, closed}, message) => {
      expect(!getBox(closed), "sendSession called on closed session");
      sendClient(client, {
        type: "send",
        session: identifier,
        message,
      });
    },
  };
};


//     const identifier = getUniqueIdentifier();
//     const closed = createToggle();
//     return {}
//     awaitClientTermination(client).then(() => {
//       expect(isToggleFlipped(closed), "client was closed by the server");
//     }).catch(expectDeadcode("client error >> %e"));
//     sendClient(client, {
//       type: "open",
//       data: options,
//     });
//     return {client, closed};
//   },
//   closeSession: ({client, closed}, reason) => {
//     expect(!isToggleFlipped(closed), "session was already closed");
//     flipToggle(closed);
//     sendClient(client, {
//       type: "close",
//       data: reason,
//     });
//     closeClient(client);
//   },
//   sendSession: ({client, closed}, data) => {
//     expect(!isToggleFlipped(closed), "cannot send message to a closed session");
//     sendClient(client, {type:"message", data});
//   };
// });
