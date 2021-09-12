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
            recordBeginApply: null,
            recordEndApply: null,
            recordBeforeJump: null,
            recordAfterJump: null,
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
      runtime.recordBeforeJump = () => {
        const index = incrementEventCounter(frontend);
        sendClient(client, recordBeforeJump(frontend, index, null));
        return index;
      };
      runtime.recordAfterJump = (index) => {
        sendClient(client, recordAfterJump(frontend, index, null));
      };
      return [
        "recordBeginApply",
        "recordEndApply",
        "recordBeforeJump",
        "recordAfterJump",
      ].map((key) => ({
        object: runtime,
        key,
        value: noop,
      }));
    },
  };
};
