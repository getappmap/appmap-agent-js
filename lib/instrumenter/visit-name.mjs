
import dummify from "./dummify.mjs";

const visitName = (node, location) => {
  if (node.type === "Identifier") {
    return {
      node: {
        type: "Identifier",
        name: node.name
      },
      entities: []
    };
  }
  return dummify("Name", node);
};
