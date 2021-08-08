export const createBox = (value) => ({ value });
export const getBox = ({ value }) => value;
export const setBox = (box, value) => {
  box.value = value;
};
