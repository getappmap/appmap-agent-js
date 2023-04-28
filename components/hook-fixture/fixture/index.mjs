import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { validateMessage } from "../../validate/index.mjs";
import { createFrontend, flushMessageArray } from "../../frontend/index.mjs";

export const testHookAsync = async (
  { hook, unhook },
  options,
  callbackAsync,
) => {
  options = {
    configuration: {},
    url: null,
    ...options,
  };
  const configuration = extendConfiguration(
    createConfiguration(import.meta.url),
    { ...options.configuration, session: "session" },
    options.url,
  );
  const frontend = createFrontend(configuration);
  const hooking = hook(frontend, configuration);
  try {
    await callbackAsync();
  } finally {
    unhook(hooking);
  }
  const messages = flushMessageArray(frontend);
  messages.forEach(validateMessage);
  return messages;
};
