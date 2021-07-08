export const makeIncrement =
  (counter = 0, step = 1) =>
  () =>
    (counter += step);
