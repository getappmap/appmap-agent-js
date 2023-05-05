
type Counter = {
  value: number,
};

export const createCounter = (value: number): Counter => ({ value });

export const gaugeCounter = ({ value }: Counter): number => value;

export const incrementCounter = (counter: Counter): void => {
  counter.value += 1;
};

export const decrementCounter = (counter: Counter): void => {
  counter.value -= 1;
};
