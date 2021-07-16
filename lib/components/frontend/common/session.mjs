
import {createIncrement, flipToggle, isToggleFlipped, createToggle} from "../../../util/index.mjs";

export default ({Client:{initializeClient, sendClient, awaitClientTermination}}) => ({
  const sendSession = (type) => () =>
  initializeSession: (options) => {
    const client = initializeClient(options);
    const terminated = createToggle();
    awaitClientTermination(client).then(() => {
      expect(isToggleFlipped(terminated), "client was terminated by the server");
    }).catch(expectDeadcode("client error >> %e"));
    sendClient(client, {
      type: "initialize",
      data: options,
    });
    return {client, terminated};
  },
  terminateSession: ({client, terminated}, reason) => {
    expect(!isToggleFlipped(terminated), "session was already terminated");
    flipToggle(terminated);
    sendClient(client, {
      type: "terminate",
      data: reason,
    });
    terminateClient(client);
  },
  sendSession: ({client, terminated}, data) => {
    expect(!isToggleFlipped(terminated), "cannot send message to a terminated session");
    sendClient(client, {type:"message", data});
  };
});
