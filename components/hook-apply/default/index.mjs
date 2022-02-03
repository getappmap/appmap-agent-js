const _eval = eval;

export default (dependencies) => {
  const {
    util: { assignProperty },
    interpretation: { runScript },
    agent: {
      getSerializationEmptyValue,
      getInstrumentationIdentifier,
      recordBeginApply,
      recordEndApply,
      recordBeforeJump,
      recordAfterJump,
    },
    util: { noop },
  } = dependencies;
  return {
    unhook: (backup) => {
      backup.forEach(assignProperty);
    },
    hook: (agent, { hooks: { apply } }) => {
      if (!apply) {
        return [];
      }
      const identifier = getInstrumentationIdentifier(agent);
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
        "file:///appmap-setup.js",
      );
      const runtime = _eval(identifier);
      runtime.empty = getSerializationEmptyValue(agent);
      runtime.recordBeginApply = (_function, _this, _arguments) =>
        recordBeginApply(agent, {
          function: _function,
          this: _this,
          arguments: _arguments,
        });
      runtime.recordEndApply = (index, error, result) =>
        recordEndApply(agent, index, { error, result });
      runtime.recordBeforeJump = () => recordBeforeJump(agent, null);
      runtime.recordAfterJump = (index) => recordAfterJump(agent, index, null);
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
