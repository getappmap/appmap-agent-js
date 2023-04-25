const obj = {
  toString() {
    return "obj";
  },
};

const identity = (x) => x;

identity(obj);
