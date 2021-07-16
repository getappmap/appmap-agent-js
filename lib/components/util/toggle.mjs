export const createToggle = () => ({ value: false });

export const flipToggle = (toggle) => {
  toggle.value = !toggle.value;
};

export const isToggleReversed = ({value}) => value;
