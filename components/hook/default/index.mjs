const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const HookApply = await import(`../../hook-apply/index.mjs${__search}`);
const HookGroup = await import(`../../hook-group/index.mjs${__search}`);
const HookEsm = await import(`../../hook-esm/index.mjs${__search}`);
const HookCjs = await import(`../../hook-cjs/index.mjs${__search}`);
const HookEval = await import(`../../hook-eval/index.mjs${__search}`);
const HookQuery = await import(`../../hook-query/index.mjs${__search}`);
const HookHttpClient = await import(
  `../../hook-http-client/index.mjs${__search}`
);
const HookHttpServer = await import(
  `../../hook-http-server/index.mjs${__search}`
);

const Hooks = [
  HookApply,
  HookGroup,
  HookEsm,
  HookCjs,
  HookEval,
  HookQuery,
  HookHttpClient,
  HookHttpServer,
];

const generateHookSingle = (agent, configuration) => (_, index) =>
  Hooks[index].hook(agent, configuration);

const unhookSingle = (hooking, index) => Hooks[index].unhook(hooking);

export const hook = (agent, configuration) =>
  Hooks.map(generateHookSingle(agent, configuration));

export const unhook = (hooking) => hooking.map(unhookSingle);
