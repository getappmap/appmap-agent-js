export const catchError = (intercept, closure, ...values) => {
  try {
    return closure(...values);
  } catch (error) {
    return intercept(error);
  }
};
