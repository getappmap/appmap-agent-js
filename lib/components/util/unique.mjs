const global_Date_now = Date.now;
const global_Math_random = Math.random;

export const getUniqueIdentifier = () =>
  `${global_Date_now().toString(32).substr(-4)}${global_Math_random()
    .toString(32)
    .substr(-4)}`;
