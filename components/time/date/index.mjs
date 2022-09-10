const {
  Date: { now },
} = globalThis;

export default (_dependencies) => {
  return { now };
};
