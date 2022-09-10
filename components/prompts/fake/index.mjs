export default (_dependencies) => {
  return {
    prompts: (prompt) => globalThis.GLOBAL_PROMPTS(prompt),
  };
};
