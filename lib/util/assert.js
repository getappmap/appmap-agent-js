
const global_Error = Error;

class AppmapAgentError extends Error;

exports.AppmapAgentError = AppmapAgentError;

exports.assert = (boolean, template, ... values) => {
  if (!boolean) {
    throw new global_Error(format(template, values));
  }
};

exports.expect = (boolean, template, ... values) => {
  if (!boolean) {
    throw new AppmapAgentError(format(template, values));
  }
};

exports.assertSuccess = (closure, template, ... values) => {
  try {
    return closure;
  } catch (error) {
    throw new global_Error(format(template, [... values, error.message]));
  }
};

exports.expectSuccess = (closure, template, ... values) => {
  try {
    return closure;
  } catch (error) {
    throw new AppmapAgentError(format(template, [... values, error.message]));
  }
};

exports.assertDeadcode = (template, ... values) => (error) => {
  throw new global_Error(format(template, [... values, error.message]));
};

exports.expectDeadcode = (tempalte, ...values) => (error) => {
  throw new AppmapAgentError(format(template, [... values, error.message]));
};
