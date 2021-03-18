
context = {
  type: "ObjectMethod",
  name: null | string
} | {
  type: "ClassConstructor",
  name: null | string
} | {
  type: "ClassMethod",
  static: boolean,
  name: null | string
}

  
  kind: {type:"ObjectMethod"} | {type:"ClassConstructor"} | {type:"ClassMethod", static:boolean},
  name: null | string,
};
export const visitClosure = (node, context) => {
  context = {
    kind: null 
    name: null
  };
};