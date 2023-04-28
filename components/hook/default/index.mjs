import * as HookApply from "../../hook-apply/index.mjs";
import * as HookGroup from "../../hook-group/index.mjs";
import * as HookModule from "../../hook-module/index.mjs";
import * as HookEval from "../../hook-eval/index.mjs";
import * as HookError from "../../hook-error/index.mjs";
import * as HookExit from "../../hook-exit/index.mjs";
import * as HookQuery from "../../hook-query/index.mjs";
import * as HookHttpClient from "../../hook-http-client/index.mjs";
import * as HookHttpServer from "../../hook-http-server/index.mjs";

const Hooks = [
  HookApply,
  HookGroup,
  HookModule,
  HookEval,
  HookError,
  HookExit,
  HookQuery,
  HookHttpClient,
  HookHttpServer,
];

const generateHookSingle = (frontend, configuration) => (_, index) =>
  Hooks[index].hook(frontend, configuration);

const unhookSingle = (hooking, index) => Hooks[index].unhook(hooking);

export const hook = (frontend, configuration) =>
  Hooks.map(generateHookSingle(frontend, configuration));

export const unhook = (hooking) => hooking.map(unhookSingle);
