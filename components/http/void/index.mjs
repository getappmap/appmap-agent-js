const _Promise = Promise;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { generateDeadcode },
  } = dependencies;
  return {
    requestAsync: generateDeadcode("requestAsync should not be called on http/void"),
    generateRespondAsync: generateDeadcode("requestAsync should not be called on http/void"),
  };
};
