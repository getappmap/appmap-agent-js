/* global GLOBAL_PROMPTS */

export default (dependencies) => {
  return {
    prompts: (prompt) => GLOBAL_PROMPTS(prompt),
  };
};
