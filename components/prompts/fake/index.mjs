const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

export const prompts = (prompt) => globalThis.GLOBAL_PROMPTS(prompt);
