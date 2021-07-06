
import {createIncrement} from "../../../util/index.mjs";
const global_Date_now = Date.now;

export const createSession = (getCurrentGroupID, {send, close}, options) => {
  const increment = createIncrement(0, 2);
  send({
    type: "initialize",
    data: options
  });
  return {
    terminate: (data) => {
      send({
        type: "terminate",
        data,
      });
      close();
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
          group: getCurrentGroupID(),
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
          group: getCurrentGroupID(),
          time: global_Date_now(),
          type: null,
          id,
          data,
        }
      });
    }
  };
};
