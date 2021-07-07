
const global_Error = Error;

export const deadcode = (message) => () => {
  throw new global_Error(message);
};
