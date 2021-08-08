export const zip = (array1, array2, _default) => {
  const { length: length2 } = array2;
  return array1.map((element1, index1) => [
    element1,
    index1 < length2 ? array2[index1] : _default,
  ]);
};
