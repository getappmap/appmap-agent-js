
const visit = (node, context) => visitors[node.type](node, context);

const visitors = {
  BinaryExpression: (node, context) => ({
    type: "BinaryExpression",
    operator: node.operator,
    left: Expression.visit(node, context),
    rigth: Expression.visit(node, context)
  }),
  UnaryOperation: (node, context) => ({
    type: "UnaryOperation",
    operator: node.operator,
    argument: Expression.visit(node, context)
  }),
  ThisExpression: (node, context) => ({
    ...node
  }),
  SuperExpression: (node, context) => ({
    ...node
  })


};
