/* global GLOBAL_PROMPTS */

export default (_dependencies) => {
  return {
    prompts: (prompt) => GLOBAL_PROMPTS(prompt),
  };
};
