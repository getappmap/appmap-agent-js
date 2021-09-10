const _eval = eval;

export default (dependencies) => {
  const {
    util: { assignProperty },
    interpretation: { runScript },
    client: { sendClient },
    frontend: {
      getSerializationEmptyValue,
      getInstrumentationIdentifier,
      incrementEventCounter,
      recordBeginApply,
      recordEndApply,
      recordBeforeJump,
      recordAfterJump,
    },
    util: { noop },
  } = dependencies;
  return {
    unhookApply: (backup) => {
      backup.forEach(assignProperty);
    },
    hookApply: (client, frontend, { hooks: { apply } }) => {
      if (!apply) {
        return [];
      }
      const identifier = getInstrumentationIdentifier(frontend);
      runScript(
        `
          const ${identifier}_APPLY_ID = 0;
          const ${identifier} = {
            recordBeforeApply: null,
            recordAfterApply: null,
            recordAwait: null,
            recordYield: null,
            recordYieldAll: null,
            empty: null
          };
        `,
      );
      const runtime = _eval(identifier);
      runtime.empty = getSerializationEmptyValue(frontend);
      runtime.recordBeginApply = (_function, _this, _arguments) => {
        const index = incrementEventCounter(frontend);
        sendClient(
          client,
          recordBeginApply(frontend, index, {
            function: _function,
            this: _this,
            arguments: _arguments,
          }),
        );
        return index;
      };
      runtime.recordEndApply = (index, error, result) => {
        sendClient(client, recordEndApply(frontend, index, { error, result }));
      };
      runtime.recordAwait = async (promise) => {
        const index = incrementEventCounter(frontend);
        sendClient(client, recordBeforeJump(frontend, index, null));
        try {
          return await promise;
        } finally {
          sendClient(client, recordAfterJump(frontend, index, null));
        }
      };
      runtime.recordYield = function* (element) {
        const index = incrementEventCounter(frontend);
        sendClient(client, recordBeforeJump(frontend, index, null));
        yield element;
        sendClient(client, recordAfterJump(frontend, index, null));
      };
      runtime.recordYieldAll = function* (generator) {
        const index = incrementEventCounter(frontend);
        sendClient(client, recordBeforeJump(frontend, index, null));
        yield* generator;
        sendClient(client, recordAfterJump(frontend, index, null));
      };
      return [
        "recordBeforeApply",
        "recordAfterApply",
        "recordAwait",
        "recordYield",
        "recordYieldAll",
      ].map((key) => ({
        object: runtime,
        key,
        value: noop,
      }));
    },
  };
};
