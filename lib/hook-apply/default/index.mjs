
import VirtualMachine from "vm";

const {runInThisContext} = VirtualMachine;

const _eval = eval;

export default (dependencies) => {
  const {
    interpretation: {runScript},
    client: {sendClient},
    frontend: {
      getSerializationEmptyValue,
      getInstrumentationIdentifier,
      incrementEventCounter,
      recordBeforeApply,
      recordAfterApply,
    },
  } = dependencies;
  return {
    hookApplyAsync: (promise, {client, frontend}, options) => {
      const identifier = getInstrumentationIdentifier(frontend);
      runInThisContext(`const ${identifier} = {beforeApply:null, afterApply:null, empty:null};`);
      const runtime = _eval(identifier);
      runtime.empty = getSerializationEmptyValue(frontend);
      runtime.beforeApply = (_function, _this, _arguments) => {
        const index = incrementEventCounter(frontend);
        sendClient(client, messageBeforeApply(frontend, index, {
          function: _function,
          this: _this,
          arguments: _arguments
        }));
        return index;
      };
      runtime.afterApply = (index, error, result) => {
        sendClient(client, messageAfterApply(frontend, index, {error, result}));
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
