import { setSimpleVisitor, visit } from "./visit.mjs";

export default ({}) => [
  [
    "Program",
    {
      captionize: (lineage) => null,
      split: (node) => node.body,
      join: (node, body) => ({
        type: "Program",
        sourceType: node.sourceType,
        body,
      }),
      claim: (entities, lineage, caption, index) => entities,
    },
  ],
];

//     {
//       captionize: (lineage) => {},
//       split: (node) => [node.body],
//       joinNode: (node, [body]) => ({
//         type: "Program",
//         sourceType: node.sourceType,
//         body,
//       }),
//       joinEntity: (entities, index, lineage, caption) => entities,
//     },
//   ],
// ];

setSimpleVisitor(
  "Program",
  (node, context) => [node.body.map((child) => visit(child, context, node))],
  (node, context, body) => ({
    type: "Program",
    sourceType: node.sourceType,
    body,
  }),
);
