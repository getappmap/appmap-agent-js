const {
  Array,
  Math: { min },
} = globalThis;

export const zip = (array1, array2) => {
  const length = min(array1.length, array2.length);
  const pairs = new Array(length);
  for (let index = 0; index < length; index += 1) {
    pairs[index] = [array1[index], array2[index]];
  }
  return pairs;
};
