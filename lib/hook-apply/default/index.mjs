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
      recordBeforeApply,
      recordAfterApply,
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
        `const ${identifier} = {recordBeforeApply:null, recordAfterApply:null, empty:null};`,
      );
      const runtime = _eval(identifier);
      runtime.empty = getSerializationEmptyValue(frontend);
      runtime.recordBeforeApply = (_function, _this, _arguments) => {
        const index = incrementEventCounter(frontend);
        sendClient(
          client,
          recordBeforeApply(frontend, index, {
            function: _function,
            this: _this,
            arguments: _arguments,
          }),
        );
        return index;
      };
      runtime.recordAfterApply = (index, error, result) => {
        sendClient(
          client,
          recordAfterApply(frontend, index, { error, result }),
        );
      };
      return [
        { object: runtime, key: "recordBeforeApply", value: noop },
        { object: runtime, key: "recordBeforeApply", value: noop },
      ];
    },
  };
};
