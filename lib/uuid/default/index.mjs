const { now } = Date;
const { random } = Math;

const getUUID = () =>
  `${now().toString(32).substr(-4)}${random().toString(32).substr(-4)}`;

export default (dependencies) => {
  return { getUUID };
};
