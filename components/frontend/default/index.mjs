import { assert, createCounter, incrementCounter } from "../../util/index.mjs";
import { instrument as instrumentInner } from "../../instrumentation/index.mjs";
import {
  createSerialization,
  serialize,
  getSerializationEmptyValue as getSerializationEmptyValueInner,
} from "../../serialization/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
export {
  getJumpPayload,
  getBundlePayload,
  formatApplyPayload,
  formatReturnPayload,
  formatThrowPayload,
  formatAwaitPayload,
  formatResolvePayload,
  formatRejectPayload,
  formatYieldPayload,
  formatRequestPayload,
  formatResponsePayload,
  formatQueryPayload,
  getAnswerPayload,
  formatGroupPayload,
  formatUngroupPayload,
} from "./payload.mjs";

const generateFormatAmend =
  (site) =>
  ({ session }, tab, payload) => ({
    type: "amend",
    session,
    site,
    tab,
    payload,
  });

const generateFormatEvent =
  (site) =>
  ({ session }, tab, group, time, payload) => ({
    type: "event",
    session,
    site,
    tab,
    time,
    group,
    payload,
  });

export const createFrontend = (configuration) => {
  assert(
    configuration.session !== null,
    "missing session",
    InternalAppmapError,
  );
  return {
    counter: createCounter(0),
    session: configuration.session,
    serialization: createSerialization(configuration),
    configuration,
  };
};

export const getFreshTab = ({ counter }) => incrementCounter(counter);

export const getSerializationEmptyValue = ({ serialization }) =>
  getSerializationEmptyValueInner(serialization);

export const instrument = ({ configuration }, file, mapping) =>
  instrumentInner(configuration, file, mapping);

export const formatError = ({ session, serialization }, value) => ({
  type: "error",
  session,
  error: serialize(serialization, value),
});

export const formatStartTrack = ({}, track, configuration) => ({
  type: "start",
  track,
  configuration,
});

export const formatStopTrack = ({}, track, termination) => ({
  type: "stop",
  track,
  termination,
});

export const formatGroup = ({ session }, group, child, description) => ({
  type: "group",
  session,
  group,
  child,
  description,
});

export const getSession = ({ session }) => session;

export const formatBeginEvent = generateFormatEvent("begin");

export const formatEndEvent = generateFormatEvent("end");

export const formatBeforeEvent = generateFormatEvent("before");

export const formatAfterEvent = generateFormatEvent("after");

export const formatBeginAmend = generateFormatAmend("begin");

export const formatEndAmend = generateFormatAmend("end");

export const formatBeforeAmend = generateFormatAmend("before");

export const formatAfterAmend = generateFormatAmend("after");
