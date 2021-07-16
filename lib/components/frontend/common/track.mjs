
import {sendSession} from "./session.mjs"

export const {}

export const startTrack = (Client, session, index, options) => {
  sendSession(Client, session, "start", {
    track: index,
    options
  });
  return {
    session,
    index,
  };
};

const controlTrack = (action, Client, {session, index}) => {
  sendSession(Client, session, action, index);
};

export const stopTrack = bind(controlTrack, "stop");

export const pauseTrack = bind(controlTrack, "pause");

export const playTrack = bind(controlTrack, "start");
