const {
  undefined,
  Reflect: { getOwnPropertyDescriptor },
} = globalThis;

export const {
  Object: {
    hasOwn = (object, key) =>
      getOwnPropertyDescriptor(object, key) !== undefined,
  },
} = globalThis;

export const filterAsync = async (array, predicateAsync) => {
  const filtered_array = [];
  for (let index = 0; index < array.length; index += 1) {
    const element = array[index];
    if (await predicateAsync(element, index, array)) {
      filtered_array.push(element);
    }
  }
  return filtered_array;
};

export const doesNotInclude = (array, element) => !array.includes(element);

export const isNotEmptyString = (any) => any !== "";

export const isArrayShallowEqual = (array1, array2) => {
  const { length: length1 } = array1;
  const { length: length2 } = array2;
  if (length1 !== length2) {
    return false;
  } else {
    for (let index = 0; index < length1; index += 1) {
      if (array1[index] !== array2[index]) {
        return false;
      }
    }
    return true;
  }
};

export const makeTrueEntry = (key) => [key, true];
