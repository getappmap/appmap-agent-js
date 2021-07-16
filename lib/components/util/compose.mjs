export const compose = (closure1, closure2) => (argument) =>
  closure2(closure1(argument));
