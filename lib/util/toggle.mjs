export const createToggle = (value) => ({ value });

export const setToggleOn = (toggle) => {
  toggle.value = true;
};

export const setToggleOff = (toggle) => {
  toggle.value = false;
};

export const isToggleOn = ({ value }) => value;

export const isToggleOff = ({ value }) => !value;
