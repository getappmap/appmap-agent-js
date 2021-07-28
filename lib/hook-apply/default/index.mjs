
const _eval = eval;

export default (dependencies) => {
  const {
    interpretation: {runScript},
    client: {sendClient, asyncClienTermination},
    state: {
      getSerializationEmptyValue,
      getInstrumentationIdentifier,
      incrementEventCounter,
      recordBeforeApply,
      recordAfterApply,
    },
  } = dependencies;
  return {
    hookApplyAsync: async (state, client, {hooks:{apply}}) => {
      if (!apply) {
        return _Promise.resolve(null);
      }
      const identifier = getInstrumentationIdentifier(state);
      runScript(`const ${identifier} = {beforeApply:null, afterApply:null, empty:null};`);
      const runtime = _eval(identifier);
      runtime.empty = getSerializationEmptyValue(state);
      runtime.beforeApply = (_function, _this, _arguments) => {
        const index = incrementEventCounter(state);
        sendClient(client, recordBeforeApply(state, index, {
          function: _function,
          this: _this,
          arguments: _arguments
        }));
        return index;
      };
      runtime.afterApply = (index, error, result) => {
        sendClient(client, recordBeforeApply(state, index, {error, result}));
      };
      try {
        return await asyncClienTermination(client);
      } finally {
        runtime.empy = null;
        runtime.beforeApply = noop;
        runtime.afterApply = noop;
      }
    },
  };
};
