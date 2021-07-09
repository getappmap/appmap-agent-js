
import {createIncrement} from "../../../util/index.mjs";
const global_Date_now = Date.now;

const dead_send = deadcode("send called on terminated session");

const dead_close = deadcode("terminate called on terminated session");

const onRejection = expectDeadcode("client error >> %e");

export const initialize = (getCurrentAsync, open, options) => {
  let {life, close, send} = open();
  life.then(() => {
    expect(send === dead_send, "the client was closed by the server");
  }, onRejection);
  const increment = createIncrement(0, 2);
  send(
    {
      type: "initialize",
      data: options
    },
  );
  return {
    terminate: (data) => {
      send({
        type: "terminate",
        data,
      });
      close();
      send = dead_send;
      close = dead_close;
    },
    registerEntity: (path, entity) => {
      send({
        type: "register",
        data: {
          path,
          entity
        }
      });
    },
    controlTrack: (track, type, data) => {
      send({
        type: "control",
        data: {
          track,
          type,
          data
        }
      });
    },
    linkGroup: (group1, group2) => {
      send({
        type: "link",
        data: [group1, group2]
      });
    },
    recordBeforeEvent: (type, data) => {
      send({
        type: "record",
        data: {
          async: getCurrentAsync(),
          time: global_Date_now(),
          type,
          id: counter,
          data,
        }
      });
      return increment() - 1;
    },
    recordAfterEvent: (id, data) => {
      send({
        type: "record",
        data: {
          async: getCurrentAsync(),
          time: global_Date_now(),
          type: null,
          id,
          data,
        }
      });
    }
  };
};
