
import makeVisit from "./make-visit.mjs";
import {visitStatement} from  "./visit-statement.mjs";

const getEntities = ({entities}) => entities;
const getNode = ({node}) => node;

export const visitProgram = makeVisit("Program", {
  __proto__: null,
  Progam: (node, location) => {
    const pairs = node.body.map((child) => visitStatement(child, location));
    return {
      node: {
        type: "Program",
        sourceType: node.sourceType,
        body: pairs.map(getNode)
      },
      entities: pairs.flatMap(getEntities)
    }
  }
});
