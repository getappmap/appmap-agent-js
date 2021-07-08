export const assert = (boolean, message) => {
  if (!boolean) {
    throw new Error(message);
  }
};
