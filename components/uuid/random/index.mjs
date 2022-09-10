
const {
  Date: {now},
  Math: {random},
} = globalThis;

const getUUID = () =>
  `${now().toString(32).substr(-4)}${random().toString(32).substr(-4)}`;

export default (_dependencies) => {
  return { getUUID };
};
