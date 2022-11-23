const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

import { createCounter, incrementCounter } from "../../util/index.mjs";
import {
  createInstrumentation,
  instrument as instrumentInner,
} from "../../instrumentation/index.mjs";
import {
  createSerialization,
  serialize,
  getSerializationEmptyValue as getSerializationEmptyValueInner,
} from "../../serialization/index.mjs";

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
  getResumePayload,
  formatRequestPayload,
  formatResponsePayload,
  formatQueryPayload,
  getAnswerPayload,
  formatGroupPayload,
  formatUngroupPayload,
} from "./payload.mjs";

const toSourceMessage = (source) => ({
  type: "source",
  ...source,
});

const generateFormatAmend =
  (site) =>
  ({}, tab, payload) => ({
    type: "amend",
    site,
    tab,
    payload,
  });

const generateFormatEvent =
  (site) =>
  ({}, tab, group, time, payload) => ({
    type: "event",
    site,
    tab,
    time,
    group,
    payload,
  });

export const createFrontend = (configuration) => ({
  counter: createCounter(0),
  serialization: createSerialization(configuration),
  instrumentation: createInstrumentation(configuration),
});

export const getFreshTab = ({ counter }) => incrementCounter(counter);

export const getSerializationEmptyValue = ({ serialization }) =>
  getSerializationEmptyValueInner(serialization);

export const instrument = (
  { instrumentation },
  script_file,
  source_map_file,
) => {
  const { url, content, sources } = instrumentInner(
    instrumentation,
    script_file,
    source_map_file,
  );
  return {
    url,
    content,
    messages: sources.map(toSourceMessage),
  };
};

export const formatError = ({ serialization }, value) => ({
  type: "error",
  error: serialize(serialization, value),
});

export const formatStartTrack = ({}, track, configuration, url) => ({
  type: "start",
  track,
  configuration,
  url,
});

export const formatStopTrack = ({}, track, termination) => ({
  type: "stop",
  track,
  termination,
});

export const formatGroup = ({}, group, child, description) => ({
  type: "group",
  group,
  child,
  description,
});

export const formatBeginEvent = generateFormatEvent("begin");

export const formatEndEvent = generateFormatEvent("end");

export const formatBeforeEvent = generateFormatEvent("before");

export const formatAfterEvent = generateFormatEvent("after");

export const formatBeginAmend = generateFormatAmend("begin");

export const formatEndAmend = generateFormatAmend("end");

export const formatBeforeAmend = generateFormatAmend("before");

export const formatAfterAmend = generateFormatAmend("after");
