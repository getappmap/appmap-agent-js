import { InternalAppmapError } from "../../error/index.mjs";
import { assert, noop, assignProperty } from "../../util/index.mjs";
import { defineGlobal } from "../../global/index.mjs";
import { now } from "../../time/index.mjs";
import { getCurrentGroup } from "../../group/index.mjs";
import {
  getFreshTab,
  getSerializationEmptyValue,
  recordBeginApplyEvent,
  recordEndReturnEvent,
  recordEndThrowEvent,
  recordBeforeAwaitEvent,
  recordBeforeYieldEvent,
  recordAfterResolveEvent,
  recordAfterRejectEvent,
} from "../../frontend/index.mjs";

export const unhook = (backup) => {
  backup.forEach(assignProperty);
};

export const hook = (frontend, { hooks: { apply: apply_hook_variable } }) => {
  if (apply_hook_variable === null) {
    return [];
  } else {
    const runtime = {
      empty: getSerializationEmptyValue(frontend),
      getFreshTab: () => getFreshTab(frontend),
      recordApply: (tab, function_, this_, arguments_) => {
        recordBeginApplyEvent(
          frontend,
          tab,
          getCurrentGroup(),
          now(),
          function_,
          this_,
          arguments_,
        );
      },
      recordReturn: (tab, function_, result) => {
        recordEndReturnEvent(
          frontend,
          tab,
          getCurrentGroup(),
          now(),
          function_,
          result,
        );
      },
      recordThrow: (tab, function_, error) => {
        recordEndThrowEvent(
          frontend,
          tab,
          getCurrentGroup(),
          now(),
          function_,
          error,
        );
      },
      recordAwait: (tab, promise) => {
        recordBeforeAwaitEvent(
          frontend,
          tab,
          getCurrentGroup(),
          now(),
          promise,
        );
      },
      recordYield: (tab, iterator) => {
        recordBeforeYieldEvent(
          frontend,
          tab,
          getCurrentGroup(),
          now(),
          iterator,
        );
      },
      recordResolve: (tab, result) => {
        recordAfterResolveEvent(
          frontend,
          tab,
          getCurrentGroup(),
          now(),
          result,
        );
      },
      recordReject: (tab, error) => {
        recordAfterRejectEvent(frontend, tab, getCurrentGroup(), now(), error);
      },
    };
    assert(
      defineGlobal(apply_hook_variable, runtime),
      "global apply hook variable already defined",
      InternalAppmapError,
    );
    return [
      "getFreshTab",
      "recordApply",
      "recordReturn",
      "recordThrow",
      "recordAwait",
      "recordResolve",
      "recordReject",
      "recordYield",
    ].map((key) => ({
      object: runtime,
      key,
      value: noop,
    }));
  }
};
