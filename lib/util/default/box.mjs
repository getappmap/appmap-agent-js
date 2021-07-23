export default (dependencies) => {
  return {
    createBox: (value) => ({ value }),
    getBox: ({ value }) => value,
    setBox: (box, value) => {
      box.value = value;
    },
  };
};
