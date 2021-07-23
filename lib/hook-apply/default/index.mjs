
import VirtualMachine from "vm";

const {runInThisContext} = VirtualMachine;

const _eval = eval;

export default (dependencies) => {
  const {
    interpretation: {runScript},
    client: {sendClient},
    state: {
      getSerializationEmptyValue,
      getInstrumentationIdentifier,
      incrementEventCounter,
      recordBeforeApply,
      recordAfterApply,
    },
  } = dependencies;
  return {
    hookApplyAsync: ({promise, client, state, options}) => {
      if (!coalesce(options, "hook-apply", true)) {
        return promise;
      }
      const identifier = getInstrumentationIdentifier(state);
      runInThisContext(`const ${identifier} = {beforeApply:null, afterApply:null, empty:null};`);
      const runtime = _eval(identifier);
      runtime.empty = getSerializationEmptyValue(state);
      runtime.beforeApply = (_function, _this, _arguments) => {
        const index = incrementEventCounter(state);
        sendClient(client, messageBeforeApply(state, index, {
          function: _function,
          this: _this,
          arguments: _arguments
        }));
        return index;
      };
      runtime.afterApply = (index, error, result) => {
        sendClient(client, messageAfterApply(state, index, {error, result}));
      };
      try {
        await promise;
      } finally {
        runtime.empy = null;
        runtime.beforeApply = noop;
        runtime.afterApply = noop;
      }
    },
  };
};
